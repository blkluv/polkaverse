import { Button, Card, Checkbox, Divider } from 'antd'
import { useState } from 'react'
import { Copy } from 'src/components/urls/helpers'
import CopyOutlinedIcon from 'src/components/utils/icons/CopyOutlined'
import { StepsEnum } from '../../AuthContext'
import styles from './SignInModalContent.module.sass'

type Props = {
  setCurrentStep: (step: number) => void
}

const ShowMnemonicModalContent = ({ setCurrentStep }: Props) => {
  const MNEMONIC = 'nurse type awful punch cat pool brain artefact entire sight adult silly'
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false)

  return (
    <div className={styles.ConfirmationStepContent}>
      <Card className={styles.InnerCard}>
        <div className={styles.MnemonicText}>{MNEMONIC}</div>
        <Divider type={'vertical'} className={styles.InnerDivider} />
        <Copy text={MNEMONIC} message='Your mnemonic phrase copied'>
          <div className={styles.CopyIcon}>
            <CopyOutlinedIcon />
          </div>
        </Copy>
      </Card>
      <Checkbox className='align-self-start' onChange={e => setIsMnemonicSaved(e.target.checked)}>
        I have saved my mnemonic
      </Checkbox>
      <Button
        type='primary'
        size='large'
        disabled={!isMnemonicSaved}
        onClick={() => setCurrentStep(StepsEnum.SignInDone)}
        block
      >
        Continue
      </Button>
    </div>
  )
}

export default ShowMnemonicModalContent
