"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Monero daemon connection span.
 */
class MoneroConnectionSpan {









  constructor(span) {
    Object.assign(this, span);
  }

  toJson() {
    return Object.assign({}, this);
  }

  getConnectionId() {
    return this.connectionId;
  }

  setConnectionId(connectionId) {
    this.connectionId = connectionId;
    return this;
  }

  getNumBlocks() {
    return this.numBlocks;
  }

  setNumBlocks(numBlocks) {
    this.numBlocks = numBlocks;
    return this;
  }

  getRemoteAddress() {
    return this.remoteAddress;
  }

  setRemoteAddress(remoteAddress) {
    this.remoteAddress = remoteAddress;
    return this;
  }

  getRate() {
    return this.rate;
  }

  setRate(rate) {
    this.rate = rate;
    return this;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed) {
    this.speed = speed;
    return this;
  }

  getSize() {
    return this.size;
  }

  setSize(size) {
    this.size = size;
    return this;
  }

  getStartHeight() {
    return this.startHeight;
  }

  setStartHeight(startHeight) {
    this.startHeight = startHeight;
    return this;
  }
}exports.default = MoneroConnectionSpan;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNb25lcm9Db25uZWN0aW9uU3BhbiIsImNvbnN0cnVjdG9yIiwic3BhbiIsIk9iamVjdCIsImFzc2lnbiIsInRvSnNvbiIsImdldENvbm5lY3Rpb25JZCIsImNvbm5lY3Rpb25JZCIsInNldENvbm5lY3Rpb25JZCIsImdldE51bUJsb2NrcyIsIm51bUJsb2NrcyIsInNldE51bUJsb2NrcyIsImdldFJlbW90ZUFkZHJlc3MiLCJyZW1vdGVBZGRyZXNzIiwic2V0UmVtb3RlQWRkcmVzcyIsImdldFJhdGUiLCJyYXRlIiwic2V0UmF0ZSIsImdldFNwZWVkIiwic3BlZWQiLCJzZXRTcGVlZCIsImdldFNpemUiLCJzaXplIiwic2V0U2l6ZSIsImdldFN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJzZXRTdGFydEhlaWdodCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Nvbm5lY3Rpb25TcGFuLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9uZXJvIGRhZW1vbiBjb25uZWN0aW9uIHNwYW4uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb0Nvbm5lY3Rpb25TcGFuIHtcblxuICBjb25uZWN0aW9uSWQ6IHN0cmluZztcbiAgbnVtQmxvY2tzOiBudW1iZXI7XG4gIHJlbW90ZUFkZHJlc3M6IHN0cmluZztcbiAgcmF0ZTogbnVtYmVyO1xuICBzcGVlZDogbnVtYmVyO1xuICBzaXplOiBudW1iZXI7XG4gIHN0YXJ0SGVpZ2h0OiBudW1iZXI7XG4gIFxuICBjb25zdHJ1Y3RvcihzcGFuPzogYW55KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBzcGFuKTtcbiAgfVxuICBcbiAgdG9Kc29uKCk6IGFueSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICB9XG4gIFxuICBnZXRDb25uZWN0aW9uSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uSWQ7XG4gIH1cblxuICBzZXRDb25uZWN0aW9uSWQoY29ubmVjdGlvbklkOiBzdHJpbmcpOiBNb25lcm9Db25uZWN0aW9uU3BhbiB7XG4gICAgdGhpcy5jb25uZWN0aW9uSWQgPSBjb25uZWN0aW9uSWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldE51bUJsb2NrcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm51bUJsb2NrcztcbiAgfVxuXG4gIHNldE51bUJsb2NrcyhudW1CbG9ja3M6IG51bWJlcik6IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIHtcbiAgICB0aGlzLm51bUJsb2NrcyA9IG51bUJsb2NrcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0UmVtb3RlQWRkcmVzcygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlbW90ZUFkZHJlc3M7XG4gIH1cblxuICBzZXRSZW1vdGVBZGRyZXNzKHJlbW90ZUFkZHJlc3M6IHN0cmluZyk6IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIHtcbiAgICB0aGlzLnJlbW90ZUFkZHJlc3MgPSByZW1vdGVBZGRyZXNzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRSYXRlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucmF0ZTtcbiAgfVxuXG4gIHNldFJhdGUocmF0ZTogbnVtYmVyKTogTW9uZXJvQ29ubmVjdGlvblNwYW4ge1xuICAgIHRoaXMucmF0ZSA9IHJhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFNwZWVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3BlZWQ7XG4gIH1cblxuICBzZXRTcGVlZChzcGVlZDogbnVtYmVyKTogTW9uZXJvQ29ubmVjdGlvblNwYW4ge1xuICAgIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnNpemU7XG4gIH1cbiAgXG4gIHNldFNpemUoc2l6ZTogbnVtYmVyKTogTW9uZXJvQ29ubmVjdGlvblNwYW4ge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFN0YXJ0SGVpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnRIZWlnaHQ7XG4gIH1cbiAgXG4gIHNldFN0YXJ0SGVpZ2h0KHN0YXJ0SGVpZ2h0OiBudW1iZXIpOiBNb25lcm9Db25uZWN0aW9uU3BhbiB7XG4gICAgdGhpcy5zdGFydEhlaWdodCA9IHN0YXJ0SGVpZ2h0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJxR0FBQTtBQUNBO0FBQ0E7QUFDZSxNQUFNQSxvQkFBb0IsQ0FBQzs7Ozs7Ozs7OztFQVV4Q0MsV0FBV0EsQ0FBQ0MsSUFBVSxFQUFFO0lBQ3RCQyxNQUFNLENBQUNDLE1BQU0sQ0FBQyxJQUFJLEVBQUVGLElBQUksQ0FBQztFQUMzQjs7RUFFQUcsTUFBTUEsQ0FBQSxFQUFRO0lBQ1osT0FBT0YsTUFBTSxDQUFDQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDO0VBQ2hDOztFQUVBRSxlQUFlQSxDQUFBLEVBQVc7SUFDeEIsT0FBTyxJQUFJLENBQUNDLFlBQVk7RUFDMUI7O0VBRUFDLGVBQWVBLENBQUNELFlBQW9CLEVBQXdCO0lBQzFELElBQUksQ0FBQ0EsWUFBWSxHQUFHQSxZQUFZO0lBQ2hDLE9BQU8sSUFBSTtFQUNiOztFQUVBRSxZQUFZQSxDQUFBLEVBQVc7SUFDckIsT0FBTyxJQUFJLENBQUNDLFNBQVM7RUFDdkI7O0VBRUFDLFlBQVlBLENBQUNELFNBQWlCLEVBQXdCO0lBQ3BELElBQUksQ0FBQ0EsU0FBUyxHQUFHQSxTQUFTO0lBQzFCLE9BQU8sSUFBSTtFQUNiOztFQUVBRSxnQkFBZ0JBLENBQUEsRUFBVztJQUN6QixPQUFPLElBQUksQ0FBQ0MsYUFBYTtFQUMzQjs7RUFFQUMsZ0JBQWdCQSxDQUFDRCxhQUFxQixFQUF3QjtJQUM1RCxJQUFJLENBQUNBLGFBQWEsR0FBR0EsYUFBYTtJQUNsQyxPQUFPLElBQUk7RUFDYjs7RUFFQUUsT0FBT0EsQ0FBQSxFQUFXO0lBQ2hCLE9BQU8sSUFBSSxDQUFDQyxJQUFJO0VBQ2xCOztFQUVBQyxPQUFPQSxDQUFDRCxJQUFZLEVBQXdCO0lBQzFDLElBQUksQ0FBQ0EsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLE9BQU8sSUFBSTtFQUNiOztFQUVBRSxRQUFRQSxDQUFBLEVBQVc7SUFDakIsT0FBTyxJQUFJLENBQUNDLEtBQUs7RUFDbkI7O0VBRUFDLFFBQVFBLENBQUNELEtBQWEsRUFBd0I7SUFDNUMsSUFBSSxDQUFDQSxLQUFLLEdBQUdBLEtBQUs7SUFDbEIsT0FBTyxJQUFJO0VBQ2I7O0VBRUFFLE9BQU9BLENBQUEsRUFBVztJQUNoQixPQUFPLElBQUksQ0FBQ0MsSUFBSTtFQUNsQjs7RUFFQUMsT0FBT0EsQ0FBQ0QsSUFBWSxFQUF3QjtJQUMxQyxJQUFJLENBQUNBLElBQUksR0FBR0EsSUFBSTtJQUNoQixPQUFPLElBQUk7RUFDYjs7RUFFQUUsY0FBY0EsQ0FBQSxFQUFXO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDQyxXQUFXO0VBQ3pCOztFQUVBQyxjQUFjQSxDQUFDRCxXQUFtQixFQUF3QjtJQUN4RCxJQUFJLENBQUNBLFdBQVcsR0FBR0EsV0FBVztJQUM5QixPQUFPLElBQUk7RUFDYjtBQUNGLENBQUNFLE9BQUEsQ0FBQUMsT0FBQSxHQUFBNUIsb0JBQUEifQ==