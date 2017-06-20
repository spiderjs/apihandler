import rx = require('rx');
import fs = require('fs');
import path = require('path');
import api = require('./api');
import process = require('process');
import express = require('express');
import logger = require('log4js');
const log = logger.getLogger('apihandler-loader');

export class ConfigFileLoader implements api.ILoader {
    private configs = new Map<string, api.IMethod>();

    constructor(private rootPath?: string) {
        if (!this.rootPath) {
            this.rootPath = path.join(process.cwd(), 'config/apidef');
        }

        if (!fs.existsSync(this.rootPath)) {
            log.warn(`apidef directory not exists:${this.rootPath}`);
            return;
        }

        fs.readdirSync(this.rootPath).forEach((entry) => {

            const service = entry.replace(path.extname(entry), '');

            const data = JSON.parse(fs.readFileSync(path.join(this.rootPath as string, entry), 'utf-8'));

            for (const key in data) {

                if (key) {
                    if (!data[key].params) {
                        data[key].params = [];
                    }

                    data[key].service = service;

                    let paths = key.split(' ');

                    if (paths.length !== 2) {
                        throw new Error(`invalid apidef(${key})`);
                    }

                    const prefix = paths[0];
                    const name = `${prefix} /${service}${paths[1]}`;

                    if (name.endsWith('/')) {
                        name.substr(0, name.length - 1);
                    }

                    if (!data[key].method) {
                        paths = paths[1].split('/');
                        if (paths.length < 2) {
                            throw new Error(`invalid apidef(${key}),expect "METHOD /A/B/C/D" `);
                        }

                        data[key].method = prefix.toLowerCase() + paths.map((s) => {
                            if (s === '') {
                                return '';
                            }
                            return s[0].toUpperCase() + s.slice(1);
                        }).join('');
                    }

                    log.debug(name, JSON.stringify(data[key]));
                    this.configs.set(name, data[key]);
                }
            }
        });
    }

    public get(name: string): rx.Observable<api.IMethod> {
        const method = this.configs.get(name);
        if (method) {
            log.debug(`found method(${name}):${JSON.stringify(method)}`);
            return rx.Observable.just(method);
        } else {
            log.debug(`method(${name}) not found`);
            return rx.Observable.create<api.IMethod>((observer) => {
                observer.onError({
                    code: 'RESOURCE_NOT_FOUND',
                    errmsg: `method(${name}) not found`,
                });
            });
        }
    }
};

