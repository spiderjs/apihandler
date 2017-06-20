import rx = require('rx');

export interface IParam {
    name: string;
    required: boolean;
    json: boolean;
}

export type Param = IParam | string;

export interface IMethod {
    params: Param[];
    service: string;
    method: string;
    auth?: string[];
}

export interface ILoader {
    /**
     * @param  {string} name call url
     * @returns IMethod rpc method metadata
     */
    get(name: string): rx.Observable<IMethod>;
}

export interface IUser<T> {
    roles: string[];
    content: T;
};

export interface ICall<T> {
    name: string;
    user?: IUser<T>;
    params: object;
};

export interface IContext {
    /**
     * bind new service
     * @param  {string} name
     * @param  {any} service
     * @returns IContext
     */
    bind(name: string, service: any): IContext;
    /**
     * call service with callsite
     * @param  {ICall<User>} callsite
     * @returns rx
     */
    call<Result, User>(callsite: ICall<User>): rx.Observable<Result>;

    getLoader(): ILoader;
};
