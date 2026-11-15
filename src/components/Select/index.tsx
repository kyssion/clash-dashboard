import classnames from 'classnames'
import { useRef, useState, useMemo, useLayoutEffect, useEffect, useId, type ReactNode } from 'react'
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

    onSelect?: (value: T, e?: React.MouseEvent<HTMLLIElement>) => void
}

export function Select<T extends string | number> (props: SelectProps<T>) {
    const { value, options, onSelect, disabled, className: cn, style } = props

    const portalRef = useRef<HTMLDivElement | null>(null)
    const targetRef = useRef<HTMLDivElement>(null)
    const listboxId = useId()

    if (portalRef.current == null) {
        portalRef.current = document.createElement('div')
    }

    const [showDropDownList, setShowDropDownList] = useState(false)
    const [dropdownListStyles, setDropdownListStyles] = useState<React.CSSProperties>({})
    const [activeIndex, setActiveIndex] = useState(-1)

    const selectedIndex = useMemo(
        () => options.findIndex(option => option.value === value),
        [options, value],
    )

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

    useEffect(() => {
        if (!showDropDownList || activeIndex < 0) {
            return
        }

        const item = document.getElementById(`${listboxId}-option-${activeIndex}`)
        item?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex, listboxId, showDropDownList])

    function enabledIndex (start: number, step: number) {
        if (options.length === 0) {
            return -1
        }

        let index = start < 0 ? (step > 0 ? -1 : 0) : start
        for (let i = 0; i < options.length; i++) {
            index = (index + step + options.length) % options.length
            if (!options[index].disabled) {
                return index
            }
        }

        return -1
    }

    function initialActiveIndex () {
        if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
            return selectedIndex
        }

        return options.findIndex(option => !option.disabled)
    }

    function openDropDownList () {
        if (disabled || targetRef.current == null) {
            return
        }

        const targetRectInfo = targetRef.current.getBoundingClientRect()
        setDropdownListStyles({
            top: Math.floor(targetRectInfo.top + targetRectInfo.height) + 6,
            left: Math.floor(targetRectInfo.left) - 10,
        })
        setActiveIndex(initialActiveIndex())
        setShowDropDownList(true)
    }

    function closeDropDownList () {
        setShowDropDownList(false)
    }

    function handleShowDropList () {
        if (disabled) {
            return
        }

        if (showDropDownList) {
            closeDropDownList()
        } else {
            openDropDownList()
        }
    }

    function selectOption (index: number, event?: React.MouseEvent<HTMLLIElement>) {
        const option = options[index]
        if (option == null || option.disabled) {
            return
        }

        onSelect?.(option.value, event)
        closeDropDownList()
    }

    function handleKeyDown (event: React.KeyboardEvent<HTMLDivElement>) {
        if (disabled) {
            return
        }

        switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault()
            if (!showDropDownList) {
                openDropDownList()
            } else {
                selectOption(activeIndex)
            }
            break
        case 'ArrowDown':
            event.preventDefault()
            if (!showDropDownList) {
                openDropDownList()
            } else {
                setActiveIndex(index => enabledIndex(index, 1))
            }
            break
        case 'ArrowUp':
            event.preventDefault()
            if (!showDropDownList) {
                openDropDownList()
            } else {
                setActiveIndex(index => enabledIndex(index, -1))
            }
            break
        case 'Escape':
            if (showDropDownList) {
                event.preventDefault()
                closeDropDownList()
            }
            break
        case 'Tab':
            if (showDropDownList) {
                closeDropDownList()
            }
            break
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
            <ul className="list" role="listbox" id={listboxId}>
                {
                    options.map((option, index) => (
                        <Option
                            className={classnames({
                                selected: option.value === value,
                                active: index === activeIndex,
                            })}
                            selected={option.value === value}
                            active={index === activeIndex}
                            id={`${listboxId}-option-${index}`}
                            onClick={event => selectOption(index, event)}
                            onMouseEnter={() => setActiveIndex(index)}
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
                aria-controls={listboxId}
                aria-activedescendant={showDropDownList && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
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
    id?: string
    value: T
    disabled?: boolean
    selected?: boolean
    active?: boolean
    onClick?: (e: React.MouseEvent<HTMLLIElement>) => void
    onMouseEnter?: () => void
}

function Option<T> (props: OptionProps<T>) {
    const {
        id,
        className: cn,
        style,
        disabled = false,
        selected = false,
        active = false,
        children,
        onClick = noop,
        onMouseEnter,
    } = props
    const className = classnames('option', { disabled, active }, cn)

    return (
        <li
            id={id}
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
            onMouseEnter={onMouseEnter}
        >
            {children}
        </li>
    )
}
