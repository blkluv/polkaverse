import { newLogger } from '@subsocial/utils'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import config from 'src/config'
const { offchainSignerUrl } = config

const log = newLogger('OffchainSignerRequests')

export const OffchainSignerEndpoint = {
  SIGNUP: 'auth/signup',
  SIGNIN: 'auth/signin',
  CONFIRM: 'auth/confirm-email',
  SIGNER_SIGN: 'signer/sign',
  GENERATE_PROOF: 'auth/generateAuthByAddressProof',
  SEND_SIGNED_PROOF: 'auth/authByAddress',
  FETCH_MAIN_PROXY: 'signer/main-proxy-address',
} as const

export const getBackendUrl = (paramsUrl: string) => {
  return `${offchainSignerUrl}/${paramsUrl}`
}

export type OffchainSignerEndpoint =
  typeof OffchainSignerEndpoint[keyof typeof OffchainSignerEndpoint]

export type Method = 'GET' | 'POST'

export const setAuthOnRequest = (accessToken: string) => {
  try {
    axios.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        config.headers = config.headers ?? {}

        config.headers.Authorization = accessToken

        return config
      },
      error => {
        return Promise.reject(error)
      },
    )
  } catch (err) {
    log.error('Failed setting auth header', err)
  }
}

type SendRequestProps = {
  request: () => Promise<AxiosResponse<any, any>>
  onFaileReturnedValue: any
  onFailedText: string
}

export const sendRequest = async ({
  request,
  onFaileReturnedValue,
  onFailedText,
}: SendRequestProps) => {
  try {
    const res = await request()
    if (res.status !== 200) {
      console.warn(onFailedText)
    }

    return res.data
  } catch (err) {
    console.error(onFailedText, err)
    return onFaileReturnedValue
  }
}

type GetParams = {
  url: string
  data?: any
  config?: any
}

export type SendHttpRequestProps = {
  params: GetParams
  onFaileReturnedValue: any
  onFailedText: string
  method: Method
  accessToken?: string
}

export const sendHttpRequest = ({
  params: { url, data, config },
  method,
  ...props
}: SendHttpRequestProps) => {
  if (props.accessToken) setAuthOnRequest(props.accessToken)

  switch (method) {
    case 'GET': {
      return sendRequest({
        request: () => axios.get(getBackendUrl(url), config),
        ...props,
      })
    }
    case 'POST': {
      return sendRequest({
        request: () => axios.post(getBackendUrl(url), data, config),
        ...props,
      })
    }
    default: {
      return
    }
  }
}
