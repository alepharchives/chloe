Chloe = function (options) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 8901;

  var transports = options.transports ||
                   [Chloe.WebSocketTransport,
// TODO (trotter): Test XHR and add back the transport
//                    Chloe.XhrTransport,
                    Chloe.JsonpTransport];

  for (var i = 0, l = transports.length; i < l; i++) {
    if (transports[i].isEnabled()) {
      this.transport = new transports[i](options);
      break;
    }
  }

  this.channelSubscriptions = {};
};

Chloe.extend = function (source, obj) {
  for (var prop in source) obj[prop] = source[prop];
  return obj;
};

Chloe.prototype = {
  // Public API
  connect: function (callback) {
    var self = this;
    this.transport.connect(function (data) {
      self.sessionId = data.sessionId;
      callback();
    });
    this.transport.onmessage(function (message) {
      self.handleMessage(Chloe.Message.unpack(message));
    });
  },
  onmessage: function (callback) {
    var self = this;
    this.onmessageCallback = callback;
  },
  onclose: function (callback) {
    this.transport.onclose(callback);
  },
  send: function (data) {
    var message = Chloe.Message.pack(data, this.sessionId);
    message.send(this.transport);
  },
  subscribe: function (channel, callback) {
    var message = Chloe.Message.channelSubscribe(channel, this);
    this.channelSubscriptions[channel] = callback;
    message.send(this.transport);
  },

  // Internal functions
  handleMessage: function (message) {
    var callback = this.channelSubscriptions[message.channel];
    if (callback) {
      callback(message.data);
    } else if (this.onmessageCallback) {
      this.onmessageCallback(message.data);
    }
  }
};
