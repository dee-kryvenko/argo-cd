import {Account} from '../models';
import requests from './requests';

export class AccountsService {
    private canICache: Map<string, Promise<boolean>> = new Map();

    public list(): Promise<Account[]> {
        return requests.get('/account').then(res => (res.body.items || []) as Account[]);
    }

    public get(name: string): Promise<Account> {
        return requests.get(`/account/${name}`).then(res => res.body as Account);
    }

    public changePassword(name: string, currentPassword: string, newPassword: string): Promise<boolean> {
        return requests
            .put('/account/password')
            .send({currentPassword, name, newPassword})
            .then(res => res.status === 200);
    }

    public createToken(name: string, tokenId: string, expiresIn: number): Promise<string> {
        return requests
            .post(`/account/${name}/token`)
            .send({expiresIn, id: tokenId})
            .then(res => res.body.token as string);
    }

    public deleteToken(name: string, id: string): Promise<any> {
        return requests.delete(`/account/${name}/token/${id}`);
    }

    public canI(resource: string, action: string, subresource: string): Promise<boolean> {
        const cacheKey = `${resource}/${action}/${subresource}`;
        
        // Check if we already have a cached promise for this permission check
        if (this.canICache.has(cacheKey)) {
            return this.canICache.get(cacheKey)!;
        }
        
        // Create a new promise and cache it
        const promise = requests
            .get(`/account/can-i/${resource}/${action}/${subresource}`)
            .then(res => res.body.value === 'yes')
            .catch(err => {
                // Remove from cache on error so it can be retried
                this.canICache.delete(cacheKey);
                throw err;
            });
        
        this.canICache.set(cacheKey, promise);
        return promise;
    }

    public clearCanICache(): void {
        this.canICache.clear();
    }
}
