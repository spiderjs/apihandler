import rx = require('rx');

export class User {

};

// tslint:disable-next-line:max-classes-per-file
export class UserService {
    public getInfo(): rx.Observable<string> {
        return rx.Observable.just('test');
    }

    public postInfo(self: User, name: string, phone?: string): rx.Observable<{}> {
        return rx.Observable.just({});
    }
};
