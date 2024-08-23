export type PaginationParams = {
    page?: number
    limit?: number
}

export class PaginationRequest {
    page: number | undefined

    limit: number | undefined

    constructor(page: number | undefined, limit: number | undefined) {
        if (limit != undefined && (limit < 1 || limit > 500)) {
            throw Error('limit should be in range between 1 and 500')
        }

        if (page != undefined && page < 1) {
            throw Error(`page should be >= 1`)
        }

        this.page = page
        this.limit = limit
    }
}
