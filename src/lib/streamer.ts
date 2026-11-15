import EventEmitter from 'eventemitter3'
import { type SetRequired } from 'type-fest'

export interface Config {
    bufferLength?: number
    retryInterval?: number
}

export class StreamReader<T> {
    protected EE = new EventEmitter()

    protected config: SetRequired<Config, 'bufferLength' | 'retryInterval'>

    protected innerBuffer: T[] = []

    protected url = ''

    protected protocols: string[] | undefined = undefined

    protected connection: WebSocket | null = null

    protected retryTimer: ReturnType<typeof setTimeout> | null = null

    protected destroyed = false

    constructor (config: Config) {
        this.config = Object.assign(
            {
                bufferLength: 0,
                retryInterval: 5000,
            },
            config,
        )
    }

    protected clearRetryTimer () {
        if (this.retryTimer != null) {
            clearTimeout(this.retryTimer)
            this.retryTimer = null
        }
    }

    protected scheduleReconnect () {
        if (this.destroyed || this.retryTimer != null) {
            return
        }

        this.retryTimer = setTimeout(() => {
            this.retryTimer = null
            this.connectWebsocket()
        }, this.config.retryInterval)
    }

    protected connectWebsocket () {
        if (!this.url || this.destroyed) {
            return
        }

        let connection: WebSocket
        try {
            connection = new WebSocket(this.url, this.protocols)
        } catch (err) {
            this.EE.emit('error', err)
            this.scheduleReconnect()
            return
        }

        this.connection = connection

        connection.addEventListener('message', msg => {
            if (this.connection !== connection) {
                return
            }

            try {
                const data = JSON.parse(msg.data) as T
                this.EE.emit('data', [data])
                if (this.config.bufferLength > 0) {
                    this.innerBuffer.push(data)
                    if (this.innerBuffer.length > this.config.bufferLength) {
                        this.innerBuffer.splice(0, this.innerBuffer.length - this.config.bufferLength)
                    }
                }
            } catch (err) {
                this.EE.emit('error', err)
            }
        })

        connection.addEventListener('error', err => {
            if (this.connection !== connection) {
                return
            }

            this.EE.emit('error', err)
            connection.close()
        })

        connection.addEventListener('close', () => {
            if (this.connection !== connection) {
                return
            }

            this.connection = null
            this.scheduleReconnect()
        })
    }

    connect (url: string, protocols?: string[]) {
        const protocolsChanged = (protocols ?? []).join('\u0000') !== (this.protocols ?? []).join('\u0000')

        if (this.url === url && !protocolsChanged && this.connection != null) {
            return
        }

        if (this.url !== url) {
            this.innerBuffer = []
        }

        this.url = url
        this.protocols = protocols
        this.destroyed = false
        this.clearRetryTimer()

        const previous = this.connection
        this.connection = null
        previous?.close()

        this.connectWebsocket()
    }

    subscribe (event: string, callback: (data: T[]) => void) {
        this.EE.addListener(event, callback)
    }

    unsubscribe (event: string, callback: (data: T[]) => void) {
        this.EE.removeListener(event, callback)
    }

    buffer () {
        return this.innerBuffer.slice()
    }

    clear () {
        this.innerBuffer = []
    }

    destroy () {
        this.destroyed = true
        this.clearRetryTimer()
        this.EE.removeAllListeners()

        const connection = this.connection
        this.connection = null
        connection?.close()
    }
}
