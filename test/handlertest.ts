import { only, skip, slow, suite, test, timeout } from 'mocha-typescript';
import apihandler = require('../src');
import logger = require('log4js');
import assert = require('assert');
import user = require('./mockservice');
const log = logger.getLogger('rpc-config-loader');

@suite('api handler test')
class APHandlerTest {
    private loader: apihandler.ILoader;
    private context: apihandler.IContext;

    public before() {
        this.loader = new apihandler.ConfigFileLoader();
        this.context = new apihandler.Context(this.loader);
        this.context.bind('user', new user.UserService());
    }

    @test('GET /user/info')
    // tslint:disable-next-line:ban-types
    public clientTest(done: Function) {
        this.loader.get('GET /user/info').subscribe((method) => {
            assert.equal(method.method, 'getInfo');
            assert.equal(method.service, 'user');
            assert.deepEqual(method.auth, ['admin', 'develop']);
            done();
        });
    }

    @test('call POST /user/info')
    // tslint:disable-next-line:ban-types
    public postInfoTest(done: Function) {
        this.context.call({
            name: 'POST /user/info',
            params: {
                name: 'test',
                phone: '1890000',
            },
            user: {
                content: {},
                roles: ['admin'],
            },
        }).subscribe(() => {
            done();
        }, (error) => {
            done(error);
        });
    }

    @test('call POST /user/info without auth')
    // tslint:disable-next-line:ban-types
    public postInfoWithoutAuth(done: Function) {
        this.context.call({
            name: 'POST /user/info',
            params: {
                name: 'test',
                phone: '1890000',
            },
        }).subscribe(() => {
            done(new Error('check required param failed'));
        }, (error) => {
            done();
        });
    }

    @test('call POST /user/info without required param(name)')
    // tslint:disable-next-line:ban-types
    public postInfoWithoutNameTest(done: Function) {
        this.context.call({
            name: 'POST /user/info',
            params: {
                phone: '1890000',
            },
            user: {
                content: {},
                roles: ['admin'],
            },
        }).subscribe(() => {
            done(new Error('check required param failed'));
        }, (error) => {
            done();
        });
    }
};
