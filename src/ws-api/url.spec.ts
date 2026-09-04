import {castUrl} from './url.js'

describe('castUrl', () => {
    it('rewrites http to ws and https to wss', () => {
        expect(castUrl('https://api.example.com')).toBe('wss://api.example.com')
        expect(castUrl('http://localhost:3000')).toBe('ws://localhost:3000')
    })

    it('leaves an already-websocket url unchanged', () => {
        expect(castUrl('wss://api.example.com')).toBe('wss://api.example.com')
    })
})
