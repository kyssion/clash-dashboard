import classnames from 'classnames'
import { useRef, useState, useMemo, useLayoutEffect, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '@components'
import { noop } from '@lib/helper'
import { type BaseComponentProps } from '@models'

import './style.scss'

export interface SelectOptions<T extends string | number> {
    label: ReactNode
    value: T
    disabled?: boolean
    key?: React.Key
}

interface SelectProps<T extends string | number> extends BaseComponentProps {
    /**
     * selected value
     * must match one of options
     */
    value: T

    options: Array<SelectOptions<T>>

    disabled?: boolean

    onSelect?: (value: T, e: React.MouseEvent<HTMLLIElement>) => void
}

export function Select<T extends string | number> (props: SelectProps<T>) {
    const { value, options, onSelect, disabled, className: cn, style } = props

    const portalRef = useRef<HTMLDivElement | null>(null)
    const targetRef = useRef<HTMLDivElement>(null)

    if (portalRef.current == null) {
        portalRef.current = document.createElement('div')
    }

    const [showDropDownList, setShowDropDownList] = useState(false)
    const [dropdownListStyles, setDropdownListStyles] = useState<React.CSSProperties>({})

    useLayoutEffect(() => {
        const current = portalRef.current!
        document.body.appendChild(current)
        return () => {
            document.body.removeChild(current)
        }
    }, [])

    useEffect(() => {
        if (!showDropDownList) {
            return
        }

        function handleMouseDown (event: MouseEvent) {
            const target = event.target as Node
            if (portalRef.current?.contains(target) || targetRef.current?.contains(target)) {
                return
            }
            setShowDropDownList(false)
        }

        document.addEventListener('mousedown', handleMouseDown)
        return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [showDropDownList])

    function handleShowDropList () {
        if (disabled) {
            return
        }

        if (!showDropDownList) {
            const targetRectInfo = targetRef.current!.getBoundingClientRect()
            setDropdownListStyles({
                top: Math.floor(targetRectInfo.top + targetRectInfo.height) + 6,
                left: Math.floor(targetRectInfo.left) - 10,
            })
        }
        setShowDropDownList(!showDropDownList)
    }

    function handleKeyDown (event: React.KeyboardEvent<HTMLDivElement>) {
        if (disabled) {
            return
        }

        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault()
            handleShowDropList()
        } else if (event.key === 'Escape') {
            setShowDropDownList(false)
        }
    }

    const matchChild = useMemo(
        () => options.find(o => o.value === value),
        [value, options],
    )

    const dropDownList = (
        <div
            className={classnames('select-list', { 'select-list-show': showDropDownList })}
            style={dropdownListStyles}
        >
            <ul className="list" role="listbox">
                {
                    options.map(option => (
                        <Option
                            className={classnames({ selected: option.value === value })}
                            selected={option.value === value}
                            onClick={e => {
                                onSelect?.(option.value, e)
                                setShowDropDownList(false)
                            }}
                            disabled={option.disabled}
                            key={option.key ?? option.value}
                            value={option.value}>
                            {option.label}
                        </Option>
                    ))
                }
            </ul>
        </div>
    )

    return (
        <>
            <div
                className={classnames('select', { disabled }, cn)}
                style={style}
                ref={targetRef}
                role="combobox"
                aria-expanded={showDropDownList}
                aria-haspopup="listbox"
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={handleShowDropList}
                onKeyDown={handleKeyDown}
            >
                <span className="select-none">{matchChild?.label}</span>
                <Icon type="triangle-down" />
            </div>
            {createPortal(dropDownList, portalRef.current)}
        </>
    )
}

interface OptionProps<T> extends BaseComponentProps {
    value: T
    disabled?: boolean
    selected?: boolean
    onClick?: (e: React.MouseEvent<HTMLLIElement>) => void
}

function Option<T> (props: OptionProps<T>) {
    const { className: cn, style, disabled = false, selected = false, children, onClick = noop } = props
    const className = classnames('option', { disabled }, cn)

    return (
        <li
            className={className}
            style={style}
            role="option"
            aria-selected={selected}
            aria-disabled={disabled}
            onClick={event => {
                if (!disabled) {
                    onClick(event)
                }
            }}
        >
            {children}
        </li>
    )
}
