import classnames from 'classnames'

import { Icon } from '@components'
import { noop } from '@lib/helper'
import { type BaseComponentProps } from '@models/BaseProps'
import './style.scss'

interface SwitchProps extends BaseComponentProps {
    checked: boolean
    disabled?: boolean
    onChange?: (checked: boolean) => void
}

export function Switch (props: SwitchProps) {
    const { className, checked = false, disabled = false, onChange = noop } = props
    const classname = classnames('switch', { checked, disabled }, className)

    function toggle () {
        if (!disabled) {
            onChange(!checked)
        }
    }

    return (
        <div
            className={classname}
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={toggle}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggle()
                }
            }}
        >
            <Icon className="switch-icon font-bold" type="check" size={20} />
        </div>
    )
}
