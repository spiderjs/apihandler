import rx = require('rx');
import api = require('./api');
import logger = require('log4js');
const log = logger.getLogger('apihandler');
export class Context implements api.IContext {
    private services = new Map<string, any>();

    constructor(private loader: api.ILoader) {

    }

    public bind(name: string, service: any): api.IContext {
        this.services.set(name, service);
        return this;
    }

    public getLoader(): api.ILoader {
        return this.loader;
    }

    public call<Result, User>(callsite: api.ICall<User>): rx.Observable<Result> {

        return this.loader.get(callsite.name).flatMap((method) => {
            let rxResult: rx.Observable<Result>;
            const service = this.services.get(method.service);

            if (!service) {
                throw {
                    code: 'RESOURCE_NOT_FOUND',
                    errmsg: `can't find service(${method.service})`,
                };
            }

            if (!service[method.method]) {
                throw {
                    code: 'RESOURCE_NOT_FOUND',
                    errmsg: `can't find service(${method.service}) method(${method.method})`,
                };
            }

            if (method.auth) {
                if (!callsite.user) {
                    log.error(`require role(${JSON.stringify(method.auth)}), empty roles`);
                    throw {
                        code: 'ACCESS_REJECT',
                        errmsg: `require role(${JSON.stringify(method.auth)})`,
                    };
                }

                if (!method.auth.find((val) => {
                    return (callsite.user as api.IUser<User>).roles.find((rhs) => {
                        return rhs === val;
                    }) !== undefined;
                })) {
                    log.error(`require role(${JSON.stringify(method.auth)}), found ${JSON.stringify(callsite.user)}`);
                    throw {
                        code: 'ACCESS_REJECT',
                        errmsg: `require role(${JSON.stringify(method.auth)})`,
                    };
                }
                const params = this.parseParams(callsite.params, method.params);
                // tslint:disable-next-line:max-line-length
                log.debug(`call service(${method.service}) method(${method.method}) with user(${JSON.stringify(callsite.user)})`);
                rxResult = service[method.method](callsite.user.content, ...params);
            } else {
                const params = this.parseParams(callsite.params, method.params);
                log.debug(`call service(${method.service}) method(${method.method})`);
                rxResult = service[method.method](...params);
            }

            return rxResult;
        });
    }

    private parseParams(params: any, metadata: api.Param[]): any[] {
        const result = [];
        for (const key of metadata) {
            let param;
            let required = false;
            let json = false;
            if (typeof (key) === 'string') {
                param = key;
            } else {
                param = (key as api.IParam).name;
                required = (key as api.IParam).required;
                json = (key as api.IParam).json;
            }

            let value = params[param];

            if (value === undefined && required) {
                log.error(`required param(${param}) not found`);
                throw {
                    code: 'RESOURCE_NOT_FOUND',
                    errmsg: `required param(${param}) not found`,
                };
            }

            if (typeof (value) === 'string' && json) {
                value = JSON.parse(value);
            }

            result.push(value);
        }

        return result;
    }
};
