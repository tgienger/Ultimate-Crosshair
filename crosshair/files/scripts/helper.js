var op = op || {};


op.Accessor = function(id) {
  this.id = id;
}
op.Accessor.prototype.element = function() {
  if (this.id) {
    return document.getElementById(this.id);
  }
  return null;
}


op.Size = function(width, height) {
  this.width = width;
  this.height = height;
}



op.screenSize = function() {
  return op.Size(window.screen.width, window.screen.height);
}



op.LocalStorageWrapper = function() {
  this.data = {};
};
op.LocalStorageWrapper.prototype.getItem = function(key) {
  if (window.localStorage) return window.localStorage.getItem(key);
  return this.data[key];
};
op.LocalStorageWrapper.prototype.setItem = function(key, value) {
  if (window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    this.data[key] = value;
  }
};
op.LocalStorageWrapper.prototype.clear = function() {
  if (window.localStorage) {
    window.localStorage.clear();
  } else {
    this.data = {};
  }
};
op.storage = new op.LocalStorageWrapper();

op.getStorage = function(key) {
  if (key) {
    var value = op.storage.getItem(key);
    if (value != null) return JSON.parse(value);
  }
  return null;
};
op.setStorage = function(key, value) {
  if (key) op.storage.setItem(key, JSON.stringify(value));
};
op.clearStorage = function() {
  op.storage.clear();
}
