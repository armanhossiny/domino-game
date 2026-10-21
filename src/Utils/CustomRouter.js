const logger = require("./logger");

class CustomRouter {
  constructor() {
    this.routes = [];
    this.middlewareEvents = [];
    this.middlewareAfterEvents = [];
  }

  /**
   * register event handler for every method
   * if need to run middleware after that you can send array of function as arg2
   *
   * @param {*} method
   * @param {*} arg1
   * @param {*} arg2
   */
  handle(method, arg1, arg2) {
    const args = Array.from(arguments);
    if (args.length === 2) {
      // if no middleware sets
      this.routes.push({ method, middlewares: [], handler: arg1 });
    } else if (args.length === 3) {
      this.routes.push({ method, middlewares: arg1, handler: arg2 });
    }
  }

  /**
   * register middleware that run in every event calls
   *
   * @param {function} handler
   */
  use(handler) {
    this.middlewareEvents.push(handler);
  }

  useAfter(handler) {
    this.middlewareAfterEvents.push(handler);
  }

  /**
   *  call events
   *
   */
  async handleEvent(data) {
    const { method, ver = 0, payload } = data;
    logger.debug(`<<<<< ${method}`);

    if (!this.routes.find((r) => r.method === method)) {
      // Handle unknown event
      return;
    }

    try {
      // Apply middleware events
      for (const event of this.middlewareEvents) {
        await event(payload);
      }

      // Execute route handler
      for (const route of this.routes) {
        if (route.method !== method) {
          continue;
        }
        // Apply route-specific middlewares
        for (const middleware of route.middlewares) {
          await middleware(payload, method);
        }

        await route.handler(payload, method);
      }

      for (const event of this.middlewareAfterEvents) {
        await event(payload);
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = new CustomRouter();
