export type PaginationParams = {
    page?: number
    limit?: number
}

export class PaginationRequest {
    page: number | undefined

    limit: number | undefined

    constructor(page: number | undefined, limit: number | undefined) {
        if (this.limit != null && (this.limit < 1 || this.limit > 500)) {
            throw Error('limit should be in range between 1 and 500')
        }

        if (this.page != null && this.page < 1) {
            throw Error(`page should be >= 1`)
        }

        this.page = page
        this.limit = limit
    }
}
