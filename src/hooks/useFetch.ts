export type RequestModel = {
  params?: object
  headers?: object
  signal?: AbortSignal
}

export type RequestWithBodyModel = RequestModel & {
  body?: object | FormData
}

export const useFetch = () => {
  const handleFetch = async (
    url: string,
    request: any,
  ) => {
    const { params, signal, ...requestWithoutParams } = request ?? {}
    const requestUrl = params ? `${url}${params}` : url

    const requestBody = requestWithoutParams?.body
      ? requestWithoutParams.body instanceof FormData
        ? { ...requestWithoutParams, body: requestWithoutParams.body }
        : { ...requestWithoutParams, body: JSON.stringify(requestWithoutParams.body) }
      : requestWithoutParams

    const headers = {
      ...(request?.headers
        ? request.headers
        : request?.body && request.body instanceof FormData
          ? {}
          : { 'Content-type': 'application/json' }),
    }

    return fetch(requestUrl, { ...requestBody, headers, signal })
      .then((response) => {
        if (!response.ok) throw response

        const contentType = response.headers.get('content-type')
        const contentDisposition = response.headers.get('content-disposition')

        const headers = response.headers

        const isJsonLike =
          contentType?.includes('application/json') ||
          contentType?.includes('text/plain')
        const isAttachment = contentDisposition?.includes('attachment')

        const result = isJsonLike
          ? response.json()
          : isAttachment
            ? response.blob()
            : response

        return result
      })
      .catch(async (err) => {
        const headers = (err as any)?.headers
        const contentType = headers?.get?.('content-type')

        if (
          contentType &&
          contentType.indexOf('application/problem+json') !== -1 &&
          typeof (err as any)?.json === 'function'
        ) {
          throw await (err as any).json()
        }

        throw err
      })
  }

  return {
    get: async <T>(url: string, request?: RequestModel): Promise<T> => {
      return handleFetch(url, { ...request, method: 'get' })
    },
    post: async <T>(
      url: string,
      request?: RequestWithBodyModel,
    ): Promise<T> => {
      return handleFetch(url, { ...request, method: 'post' })
    },
    put: async <T>(url: string, request?: RequestWithBodyModel): Promise<T> => {
      return handleFetch(url, { ...request, method: 'put' })
    },
    patch: async <T>(
      url: string,
      request?: RequestWithBodyModel,
    ): Promise<T> => {
      return handleFetch(url, { ...request, method: 'patch' })
    },
    delete: async <T>(url: string, request?: RequestModel): Promise<T> => {
      return handleFetch(url, { ...request, method: 'delete' })
    },
  }
}
