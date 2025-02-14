import { isStr, toSubsocialAddress } from '@subsocial/utils'
import { Button, Form } from 'antd'
import clsx from 'clsx'
import jwtDecode from 'jwt-decode'
import { useEffect, useState } from 'react'
import AuthCode from 'react-auth-code-input'
import { useResponsiveSize } from 'src/components/responsive'
import {
  confirmEmail,
  JwtPayload,
  onErrorHandler,
  resendEmailConfirmation,
} from 'src/components/utils/OffchainSigner/api/requests'
import CountdownTimerButton from 'src/components/utils/OffchainSigner/CountdownTimerButton'
import {
  getSignerToken,
  getTempRegisterAccount,
} from 'src/components/utils/OffchainSigner/ExternalStorage'
import { CODE_DIGIT } from 'src/config/ValidationsConfig'
import useSignerExternalStorage from 'src/hooks/useSignerExternalStorage'
import { StepsEnum } from '../../AuthContext'
import styles from './SignInModalContent.module.sass'
import { RegexValidations, useFormValidation } from './useFormValidation'

type FormValues = {
  confirmationCode: number
}

type FieldName = keyof FormValues

export const fieldName = (name: FieldName): FieldName => name

type Props = {
  setCurrentStep: (step: number) => void
}

const ConfirmationModalContent = ({ setCurrentStep }: Props) => {
  const userAddress = getTempRegisterAccount()
  const subsocialAddress = toSubsocialAddress(userAddress)
  const { isMobile } = useResponsiveSize()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!subsocialAddress) setError('Subsocial address is not defined')
  const accessToken = getSignerToken(subsocialAddress!)

  useEffect(() => {
    ;(async () => {
      if (!accessToken) return
      try {
        await resendEmailConfirmation(accessToken)
      } catch (error) {
        onErrorHandler(error, setError)
      }
    })()
  }, [])

  const { isValidCode } = useFormValidation()

  const { setSignerTokensByAddress, setSignerEmailAddress } = useSignerExternalStorage()

  const [form] = Form.useForm()

  const [isFormValid, setIsFormValid] = useState(false)

  const handleError = (error: unknown) => {
    setLoading(false)
    onErrorHandler(error, setError)
  }

  const handleSubmit = async (values: FormValues) => {
    if (!accessToken) setError('Access token is not defined')

    setLoading(true)

    try {
      const props = {
        code: values.confirmationCode.toString(),
        accessToken: accessToken!,
      }
      const data = await confirmEmail(props)

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data

      const { accountAddress, email } = jwtDecode<JwtPayload>(newAccessToken)

      // Save auth tokens to local storage for getMainProxyAddress request
      setSignerTokensByAddress({
        userAddress: accountAddress,
        token: newAccessToken,
        refreshToken: newRefreshToken,
      })

      // save a new key-value pair to local storage
      setSignerEmailAddress(email, accountAddress)

      setCurrentStep(StepsEnum.ShowMnemonic)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    form.setFieldsValue({ [fieldName('confirmationCode')]: value })

    if (value.length === CODE_DIGIT) setError(null)
  }

  const isError = isStr(error)

  const handleValuesChange = (_: FormValues, allValues: FormValues) => {
    const isFilled = Object.values(allValues).every(value => Boolean(value))
    const isCodeValid = isValidCode(allValues.confirmationCode.toString())
    const isValid = isFilled && isCodeValid

    setIsFormValid(isValid)

    const isReset = isError && !isFilled
    if (isReset) setError(null)
  }

  const handleResendCode = async () => {
    try {
      const accessToken = getSignerToken(userAddress!)

      if (!accessToken) throw new Error('Token is not defined')
      await resendEmailConfirmation(accessToken)
    } catch (error) {
      onErrorHandler(error, setError, true)
    }
  }

  return (
    <Form form={form} onValuesChange={handleValuesChange} onFinish={handleSubmit}>
      <div
        className={isMobile ? styles.ConfirmationStepContentMobile : styles.ConfirmationStepContent}
      >
        <Form.Item
          name={fieldName('confirmationCode')}
          className={styles.CodeFormItem}
          validateTrigger='onBlur'
          rules={[
            {
              pattern: RegexValidations.ValidCode,
              message: 'Please enter a valid confirmation code.',
            },
          ]}
          help={error}
          validateStatus={isError ? 'error' : undefined}
        >
          <AuthCode
            containerClassName={clsx(
              styles.InputOTPContainer,
              isMobile && styles.InputOTPContainerMobile,
            )}
            length={CODE_DIGIT}
            allowedCharacters='numeric'
            onChange={handleChange}
            inputClassName={clsx(styles.InputOTP, isError && styles.InputOTPError)}
          />
        </Form.Item>

        <CountdownTimerButton
          className={styles.ButtonLinkMedium}
          baseLabel='Resend code'
          type='link'
          onClick={handleResendCode}
        />

        <Button
          type='primary'
          size='large'
          htmlType='submit'
          loading={loading}
          disabled={!isFormValid || isError || loading}
          block
        >
          Confirm
        </Button>
      </div>
    </Form>
  )
}

export default ConfirmationModalContent
