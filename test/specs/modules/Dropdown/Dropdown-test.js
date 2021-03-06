import _ from 'lodash'
import faker from 'faker'
import React from 'react'

import * as common from 'test/specs/commonTests'
import { consoleUtil, domEvent, sandbox } from 'test/utils'
import Dropdown from 'src/modules/Dropdown/Dropdown'
import DropdownDivider from 'src/modules/Dropdown/DropdownDivider'
import DropdownHeader from 'src/modules/Dropdown/DropdownHeader'
import DropdownItem from 'src/modules/Dropdown/DropdownItem'
import DropdownMenu from 'src/modules/Dropdown/DropdownMenu'

let attachTo
let options
let wrapper

// ----------------------------------------
// Wrapper
// ----------------------------------------
// we need to unmount the dropdown after every test to ensure all event listeners are cleaned up
// wrap the render methods to update a global wrapper that is unmounted after each test
const wrapperMount = (node, opts) => {
  attachTo = document.createElement('div')
  document.body.appendChild(attachTo)

  wrapper = mount(node, { ...opts, attachTo })
  return wrapper
}
const wrapperShallow = (...args) => (wrapper = shallow(...args))
const wrapperRender = (...args) => (wrapper = render(...args))

// ----------------------------------------
// Options
// ----------------------------------------
const getOptions = (count = 5) => _.times(count, n => {
  const text = _.times(3, faker.hacker.noun).join(' ')
  const value = _.snakeCase(text)
  return { text, value }
})

// -------------------------------
// Common Assertions
// -------------------------------
const dropdownMenuIsClosed = () => {
  const menu = wrapper.find('DropdownMenu')
  wrapper.should.not.have.className('visible')
  menu.should.not.have.className('visible')
}

const dropdownMenuIsOpen = () => {
  const menu = wrapper.find('DropdownMenu')
  wrapper.should.have.className('active')
  wrapper.should.have.className('visible')
  menu.should.have.className('visible')
}

const nativeEvent = { nativeEvent: { stopImmediatePropagation: _.noop } }

describe('Dropdown Component', () => {
  beforeEach(() => {
    attachTo = undefined
    wrapper = undefined
    options = getOptions()
  })

  afterEach(() => {
    if (wrapper && wrapper.unmount) wrapper.unmount()
    if (attachTo) document.body.removeChild(attachTo)
  })

  common.isConformant(Dropdown)
  common.hasUIClassName(Dropdown)
  common.hasSubComponents(Dropdown, [DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu])
  common.isTabbable(Dropdown)
  common.implementsIconProp(Dropdown)
  common.implementsShorthandProp(Dropdown, {
    propKey: 'header',
    ShorthandComponent: DropdownHeader,
    mapValueToProps: val => ({ content: val }),
  })
  common.propKeyOnlyToClassName(Dropdown, 'disabled')
  common.propKeyOnlyToClassName(Dropdown, 'error')
  common.propKeyOnlyToClassName(Dropdown, 'loading')
  common.propKeyOnlyToClassName(Dropdown, 'basic')
  common.propKeyOnlyToClassName(Dropdown, 'button')
  common.propKeyOnlyToClassName(Dropdown, 'compact')
  common.propKeyOnlyToClassName(Dropdown, 'fluid')
  common.propKeyOnlyToClassName(Dropdown, 'floating')
  common.propKeyOnlyToClassName(Dropdown, 'inline')
  // TODO: See Dropdown cx notes
  // common.propKeyOnlyToClassName(Dropdown, 'icon')
  common.propKeyOnlyToClassName(Dropdown, 'labeled')
  // TODO: See Dropdown cx notes
  // common.propKeyOnlyToClassName(Dropdown, 'link item')
  common.propKeyOnlyToClassName(Dropdown, 'multiple')
  common.propKeyOnlyToClassName(Dropdown, 'search')
  common.propKeyOnlyToClassName(Dropdown, 'selection')
  common.propKeyOnlyToClassName(Dropdown, 'simple')
  common.propKeyOnlyToClassName(Dropdown, 'scrolling')

  common.propKeyOrValueAndKeyToClassName(Dropdown, 'pointing')

  it('closes on blur', () => {
    wrapperMount(<Dropdown options={options} />)
      .simulate('click')

    dropdownMenuIsOpen()
    wrapper.simulate('blur')
    dropdownMenuIsClosed()
  })

  it('blurs the Dropdown node on close', () => {
    wrapperMount(<Dropdown options={options} selection defaultOpen />)

    const instance = wrapper.instance()
    sandbox.spy(instance._dropdown, 'blur')

    dropdownMenuIsOpen()
    wrapper.simulate('click')
    dropdownMenuIsClosed()

    instance._dropdown.blur
      .should.have.been.calledOnce()
  })

  it('opens on focus', () => {
    wrapperMount(<Dropdown options={options} />)

    dropdownMenuIsClosed()
    wrapper.simulate('focus')
    dropdownMenuIsOpen()
  })

  describe('disabled', () => {
    it('does not open on click', () => {
      wrapperMount(<Dropdown options={options} disabled />)

      dropdownMenuIsClosed()
      wrapper.simulate('click')
      dropdownMenuIsClosed()
    })

    it('does not open on click with pointer events enabled', () => {
      wrapperMount(<Dropdown options={options} disabled style={{ pointerEvents: 'all' }} />)

      dropdownMenuIsClosed()
      wrapper.simulate('click')
      dropdownMenuIsClosed()
    })

    it('does not open on focus', () => {
      wrapperMount(<Dropdown options={options} disabled />)

      dropdownMenuIsClosed()
      wrapper.simulate('focus')
      dropdownMenuIsClosed()
    })
  })

  describe('handleBlur', () => {
    it('passes the event to the onBlur prop', () => {
      const spy = sandbox.spy()
      const event = { foo: 'bar' }

      wrapperShallow(<Dropdown onBlur={spy} />)
        .simulate('blur', event)

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch(event)
    })

    it('calls selectHighlightedItem', () => {
      wrapperShallow(<Dropdown selectOnBlur />)

      const instance = wrapper.instance()
      sandbox.spy(instance, 'selectHighlightedItem')

      wrapper.simulate('blur')

      instance.selectHighlightedItem
        .should.have.been.calledOnce()
    })

    it('sets focus state to false', () => {
      wrapperShallow(<Dropdown selectOnBlur />)
        .simulate('blur')
        .should.have.state('focus', false)
    })

    it('does not call onBlur when the mouse is down', () => {
      const spy = sandbox.spy()

      wrapperShallow(<Dropdown onBlur={spy} selectOnBlur />)
        .simulate('mousedown')
        .simulate('blur')

      spy.should.not.have.been.called()
    })

    it('does not call selectHighlightedItem when the mouse is down', () => {
      const spy = sandbox.spy()

      wrapperShallow(<Dropdown onBlur={spy} selectOnBlur />)

      const instance = wrapper.instance()
      sandbox.spy(instance, 'selectHighlightedItem')

      wrapper
        .simulate('mousedown')
        .simulate('blur')

      instance.selectHighlightedItem
        .should.not.have.been.called()
    })

    it('does not set focus state when the mouse is down', () => {
      wrapperShallow(<Dropdown />)
        .setState({ focus: 'foo' })
        .simulate('mousedown')
        .simulate('blur')
        .should.have.state('focus', 'foo')
    })
  })

  describe('handleClose', () => {
    it('is called when open changes to false', () => {
      wrapperMount(<Dropdown options={options} selection />)
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      const instance = wrapper.instance()
      sandbox.spy(instance, 'handleClose')

      wrapper.simulate('click')
      dropdownMenuIsClosed()

      instance
        .handleClose
        .should.have.been.calledOnce()
    })

    it('prevents Space from opening a search Dropdown after selecting an item', () => {
      // Prevent a bug where pressing space in another control opens the Dropdown
      // https://github.com/Semantic-Org/Semantic-UI-React/issues/692
      wrapperMount(<Dropdown options={options} search selection />)

      // open, click an item, assert it is active and in the value
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      wrapper
        .find('DropdownItem')
        .first()
        .simulate('click')
        .should.have.prop('active', true)

      wrapper.should.have.state('value', options[0].value)

      dropdownMenuIsClosed()

      // doesn't open on space
      domEvent.keyDown(document, { key: ' ' })
      dropdownMenuIsClosed()
    })
  })

  describe('isMouseDown', () => {
    it('tracks when the mouse is down', () => {
      wrapperShallow(<Dropdown />)
        .simulate('mousedown')

      wrapper.instance()
        .isMouseDown
        .should.equal(true)

      domEvent.mouseUp(document)

      wrapper.instance()
        .isMouseDown
        .should.equal(false)
    })
  })

  describe('icon', () => {
    it('defaults to a dropdown icon', () => {
      Dropdown.defaultProps.icon.should.equal('dropdown')
      wrapperRender(<Dropdown />)
        .should.contain.descendants('.dropdown.icon')
    })
  })

  describe('selected item', () => {
    it('defaults to the first item', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .find('DropdownItem')
        .first()
        .should.have.prop('selected', true)
    })
    it('defaults to the first non-disabled item', () => {
      options[0].disabled = true
      wrapperShallow(<Dropdown options={options} selection />)

      // selection moved to second item
      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('selected', false)

      wrapper
        .find('DropdownItem')
        .at(1)
        .should.have.prop('selected', true)
    })
    it('defaults to selected item when options are initially empty', () => {
      const randomIndex = 1 + _.random(options.length - 2)
      const value = options[randomIndex].value

      wrapperShallow(<Dropdown options={[]} selection value={value} />)

      wrapper
        .setProps({ options, value })

      wrapper
        .find('DropdownItem')
        .at(randomIndex)
        .should.have.prop('selected', true)
    })
    it('is null when all options disabled', () => {
      const disabledOptions = options.map((o) => ({ ...o, disabled: true }))

      wrapperRender(<Dropdown options={disabledOptions} selection />)
        .should.not.have.descendants('.selected')
    })
    it('is set when clicking an item', () => {
      // random item, skip the first as its selected by default
      const randomIndex = 1 + _.random(options.length - 2)

      wrapperMount(<Dropdown options={options} selection />)
        .find('DropdownItem')
        .at(randomIndex)
        .simulate('click')
        .should.have.prop('selected', true)
    })
    it('is ignored when clicking a disabled item', () => {
      // random item, skip the first as its selected by default
      const randomIndex = 1 + _.random(options.length - 2)

      options[randomIndex].disabled = true

      wrapperMount(<Dropdown options={options} selection />)
        .simulate('click', nativeEvent)
        .find('DropdownItem')
        .at(randomIndex)
        .simulate('click', nativeEvent)
        .should.not.have.prop('selected', true)

      dropdownMenuIsOpen()
    })
    it('moves down on arrow down when open', () => {
      wrapperMount(<Dropdown options={options} selection />)

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // arrow down
      domEvent.keyDown(document, { key: 'ArrowDown' })

      // selection moved to second item
      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('selected', false)

      wrapper
        .find('DropdownItem')
        .at(1)
        .should.have.prop('selected', true)
    })
    it('moves up on arrow up when open', () => {
      wrapperMount(<Dropdown options={options} selection />)

      // open
      wrapper
        .simulate('click')
        .find('DropdownItem')
        .first()
        .should.have.prop('selected', true)

      // arrow down
      domEvent.keyDown(document, { key: 'ArrowUp' })

      // selection moved to last item
      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('selected', false)

      wrapper
        .find('DropdownItem')
        .at(options.length - 1)
        .should.have.prop('selected', true)
    })
    it('skips over items filtered by search', () => {
      const opts = [
        { text: 'a1', value: 'a1' },
        { text: 'skip this one', value: 'skip this one' },
        { text: 'a2', value: 'a2' },
      ]
      // search for 'a'
      wrapperMount(<Dropdown options={opts} search selection />)
        .simulate('click')
        .find('input.search')
        .simulate('change', { target: { value: 'a' } })

      wrapper
        .find('.selected')
        .should.contain.text('a1')

      // move selection down
      domEvent.keyDown(document, { key: 'ArrowDown' })

      wrapper
        .find('.selected')
        .should.contain.text('a2')
    })
    it('skips over disabled items', () => {
      const opts = [
        { text: 'a1', value: 'a1' },
        { text: 'skip this one', value: 'skip this one', disabled: true },
        { text: 'a2', value: 'a2' },
      ]

      wrapperMount(<Dropdown options={opts} search selection />)
        .simulate('click')

      wrapper
        .find('.selected')
        .should.contain.text('a1')

      // move selection down
      domEvent.keyDown(document, { key: 'ArrowDown' })

      wrapper
        .find('.selected')
        .should.contain.text('a2')
    })
    it('does not enter an infinite loop when all items are disabled', () => {
      const opts = [
        { text: '1', value: '1', disabled: true },
        { text: '2', value: '2', disabled: true },
      ]
      wrapperMount(<Dropdown options={opts} search selection />)
        .simulate('click')

      const instance = wrapper.instance()
      sandbox.spy(instance, 'moveSelectionBy')

      // move selection down
      domEvent.keyDown(document, { key: 'ArrowDown' })

      instance
        .moveSelectionBy
        .should.have.been.calledOnce()
    })
    it('scrolls the selected item into view', () => {
      // get enough options to make the menu scrollable
      const opts = getOptions(20)

      wrapperMount(<Dropdown options={opts} selection />)
        .simulate('click')

      dropdownMenuIsOpen()
      const menu = document.querySelector('.ui.dropdown .menu.visible')

      // Limit the menu's height and set an overflow so it's scrollable
      menu.style.height = '100px'
      menu.style.overflow = 'auto'

      //
      // Scrolls to bottom
      //

      // make sure first item is selected
      wrapper
        .find('.selected')
        .should.contain.text(opts[0].text)

      // wrap selection to last item
      domEvent.keyDown(document, { key: 'ArrowUp' })

      // make sure last item is selected
      wrapper
        .find('.selected')
        .should.contain.text(_.tail(opts).text)

      // menu should be completely scrolled to the bottom
      const isMenuScrolledToBottom = menu.scrollTop + menu.clientHeight === menu.scrollHeight
      isMenuScrolledToBottom.should.be.true(
        'When the last item in the list was selected, DropdownMenu did not scroll to bottom.'
      )

      //
      // Scrolls back to top
      //

      // wrap selection to last item
      domEvent.keyDown(document, { key: 'ArrowDown' })

      // make sure first item is selected
      wrapper
        .find('.selected')
        .should.contain.text(opts[0].text)

      // Note: For some reason the first item's offsetTop is not 0 so we need
      // to find the item's offsetTop and ensure it's at the top.
      const selectedItem = document.querySelector('.ui.dropdown .menu.visible .item.selected')
      const isMenuScrolledToTop = menu.scrollTop === selectedItem.offsetTop
      isMenuScrolledToTop.should.be.true(
        'When the first item in the list was selected, DropdownMenu did not scroll to top.'
      )
    })
    it('becomes active on enter when open', () => {
      const item = wrapperMount(<Dropdown options={options} selection />)
        .simulate('click')
        .find('DropdownItem')
        .at(1)

      // initial item props
      item.should.have.prop('selected', false)
      item.should.have.prop('active', false)

      // select and make active
      domEvent.keyDown(document, { key: 'ArrowDown' })
      domEvent.keyDown(document, { key: 'Enter' })

      item.should.have.prop('active', true)
    })
    it('closes the menu', () => {
      wrapperMount(<Dropdown options={options} selection />)
        .simulate('click')

      dropdownMenuIsOpen()

      // choose an item closes
      domEvent.keyDown(document, { key: 'Enter' })
      dropdownMenuIsClosed()
    })
  })

  describe('value', () => {
    it('sets the corresponding item to active', () => {
      const value = _.sample(options).value

      wrapperShallow(<Dropdown options={options} selection value={value} />)
        .find('DropdownItem')
        .find({ value, active: true })
        .should.be.present()
    })

    it('sets the corresponding item text', () => {
      const { text, value } = _.sample(options)

      wrapperShallow(<Dropdown value={value} options={options} selection />)
        .find('DropdownItem')
        .find({ value, text })
        .should.be.present()
    })

    it('updates active item when changed', () => {
      const value = _.sample(options).value
      let next
      while (!next || next === value) next = _.sample(options).value

      wrapperShallow(<Dropdown value={value} options={options} selection />)

      // initial active item
      wrapper
        .find('DropdownItem')
        .find({ value })
        .should.have.prop('active', true)

      // change value
      wrapper
        .setProps({ value: next })

      // next active item
      wrapper
        .find('DropdownItem')
        .find({ value: next })
        .should.have.prop('active', true)
    })

    it('updates text when value changed', () => {
      const initialItem = _.sample(options)
      const nextItem = _.sample(_.without(options, initialItem))

      wrapperMount(<Dropdown options={options} selection value={initialItem.value} />)
        .find('.text')
        .should.contain.text(initialItem.text)

      wrapper
        .setProps({ value: nextItem.value })
        .find('.text')
        .should.contain.text(nextItem.text)
    })
  })

  describe('text', () => {
    it('sets the display text', () => {
      const text = faker.hacker.phrase()

      wrapperRender(<Dropdown options={options} selection text={text} />)
        .find('.text')
        .should.contain.text(text)
    })
    it('prevents updates on item click if defined', () => {
      const text = faker.hacker.phrase()

      wrapperMount(<Dropdown options={options} selection text={text} />)
        .simulate('click')
        .find('DropdownItem')
        .at(_.random(options.length - 1))
        .simulate('click')

      wrapper
        .find('.text')
        .should.contain.text(text)
    })
    it('is updated on item click if not already defined', () => {
      wrapperMount(<Dropdown options={options} selection />)

      // open
      wrapper.simulate('click')

      // click item
      const item = wrapper
        .find('DropdownItem')
        .at(_.random(options.length - 1))
        .simulate('click')

      // text updated
      wrapper
        .find('.text')
        .should.contain.text(item.text())
    })
    it('displays if value is 0', () => {
      const text = faker.hacker.noun()

      wrapperMount(<Dropdown options={[{ value: 0, text }]} selection />)

      // open
      wrapper.simulate('click')

      // click item
      const item = wrapper
        .find('DropdownItem')
        .simulate('click')

      // text updated
      wrapper
        .find('.text')
        .should.contain.text(item.text())
    })
    it('does not display if value is \'\'', () => {
      const text = faker.hacker.noun()

      wrapperMount(<Dropdown options={[{ value: '', text }]} selection />)
        .simulate('click')
        .find('DropdownItem')
        .simulate('click')

      wrapper
        .find('.text')
        .should.contain.text('')
    })
    it('does not display if value is null', () => {
      const text = faker.hacker.noun()

      wrapperMount(<Dropdown options={[{ value: null, text }]} selection />)
        .simulate('click')
        .find('DropdownItem')
        .simulate('click')

      wrapper
        .find('.text')
        .should.contain.text('')
    })
    it('does not display if value is undefined', () => {
      const text = faker.hacker.noun()

      wrapperMount(<Dropdown options={[{ value: undefined, text }]} selection />)
        .simulate('click')
        .find('DropdownItem')
        .simulate('click')

      wrapper
        .find('.text')
        .should.contain.text('')
    })
  })

  describe('trigger', () => {
    it('displays the trigger', () => {
      const text = 'Hey there'
      const trigger = <div className='trigger'>{text}</div>

      wrapperRender(<Dropdown options={options} trigger={trigger} />)
        .find('.trigger')
        .should.contain.text(text)
    })
    it('ignores the text prop', () => {
      const text = faker.hacker.phrase()
      const trigger = <div className='trigger'>{text}</div>

      wrapperRender(<Dropdown options={options} trigger={trigger} text={text} />)
        .should.not.have.descendants('.text')
    })
  })

  describe('menu', () => {
    it('opens on dropdown click', () => {
      wrapperMount(<Dropdown options={options} selection />)

      dropdownMenuIsClosed()
      wrapper.simulate('click')
      dropdownMenuIsOpen()
    })

    it('opens on arrow down when focused', () => {
      wrapperMount(<Dropdown options={options} selection />)
        // Note: This mousedown is necessary to get the Dropdown focused
        // without it being open.
        .simulate('mousedown')
        .simulate('focus')

      dropdownMenuIsClosed()
      domEvent.keyDown(document, { key: 'ArrowDown' })
      dropdownMenuIsOpen()
    })

    it('opens on space when focused', () => {
      wrapperMount(<Dropdown options={options} selection />)
        // Note: This mousedown is necessary to get the Dropdown focused
        // without it being open.
        .simulate('mousedown')
        .simulate('focus')

      dropdownMenuIsClosed()
      domEvent.keyDown(document, { key: ' ' })
      dropdownMenuIsOpen()
    })

    it('does not open on arrow down when not focused', () => {
      wrapperMount(<Dropdown options={options} selection />)

      dropdownMenuIsClosed()
      domEvent.keyDown(document, { key: 'ArrowDown' })
      dropdownMenuIsClosed()
    })

    it('does not open on space when not focused', () => {
      wrapperMount(<Dropdown options={options} selection />)

      dropdownMenuIsClosed()
      domEvent.keyDown(document, { key: ' ' })
      dropdownMenuIsClosed()
    })

    it('closes on dropdown click', () => {
      wrapperMount(<Dropdown options={options} selection defaultOpen />)

      dropdownMenuIsOpen()
      wrapper.simulate('click')
      dropdownMenuIsClosed()
    })

    it('closes on menu item click', () => {
      wrapperMount(<Dropdown options={options} selection />)
      const item = wrapper
        .find('DropdownItem')
        .at(_.random(options.length - 1))

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // select item
      item.simulate('click')
      dropdownMenuIsClosed()
    })

    it('blurs after menu item click (mousedown)', () => {
      wrapperMount(<Dropdown options={options} selection />)
      const item = wrapper
        .find('DropdownItem')
        .at(_.random(options.length - 1))

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // select item
      item.simulate('mousedown')
      dropdownMenuIsOpen()
      item.simulate('click')
      dropdownMenuIsClosed()
    })

    it('closes on click outside', () => {
      wrapperMount(<Dropdown options={options} selection />)

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // click outside
      domEvent.click(document)
      dropdownMenuIsClosed()
    })

    it('closes on esc key', () => {
      wrapperMount(<Dropdown options={options} selection />)

      // open
      wrapper
        .find('Dropdown')
        .simulate('click')
      dropdownMenuIsOpen()

      // esc
      domEvent.keyDown(document, { key: 'Escape' })
      dropdownMenuIsClosed()
    })
  })

  describe('onOpen', () => {
    it('called when dropdown would open', () => {
      const onOpen = sandbox.spy()
      wrapperMount(<Dropdown options={options} selection onOpen={onOpen} />)

      wrapper.simulate('click')
      onOpen.should.have.been.calledOnce()
    })

    it('not called when dropdown would not open', () => {
      const onOpen = sandbox.spy()
      wrapperMount(<Dropdown options={options} selection onOpen={onOpen} />)

      domEvent.keyDown(document, { key: 'ArrowDown' })
      onOpen.should.not.have.been.calledOnce()
    })
  })

  describe('onClose', () => {
    it('called when dropdown would close', () => {
      const onClose = sandbox.spy()
      wrapperMount(<Dropdown options={options} selection defaultOpen onClose={onClose} />)

      wrapper.simulate('click')
      onClose.should.have.been.calledOnce()
    })
  })

  describe('open', () => {
    it('defaultOpen opens the menu when true', () => {
      wrapperShallow(<Dropdown options={options} selection defaultOpen />)
      dropdownMenuIsOpen()
    })
    it('defaultOpen opens the menu on search dropdowns', () => {
      wrapperShallow(<Dropdown search options={options} selection defaultOpen />)
      dropdownMenuIsOpen()
    })
    it('defaultOpen closes the menu when false', () => {
      wrapperShallow(<Dropdown options={options} selection defaultOpen={false} />)
      dropdownMenuIsClosed()
    })
    it('opens the menu when true', () => {
      wrapperShallow(<Dropdown options={options} selection open />)
      dropdownMenuIsOpen()
    })
    it('closes the menu when false', () => {
      wrapperShallow(<Dropdown options={options} selection open={false} />)
      dropdownMenuIsClosed()
    })
    it('closes the menu when toggled from true to false', () => {
      wrapperMount(<Dropdown options={options} selection open />)
        .setProps({ open: false })
      dropdownMenuIsClosed()
    })
    it('opens the menu when toggled from false to true', () => {
      wrapperMount(<Dropdown options={options} selection open={false} />)
        .setProps({ open: true })
      dropdownMenuIsOpen()
    })
  })

  describe('multiple', () => {
    it('does not close the menu on item selection with enter', () => {
      wrapperMount(<Dropdown options={options} selection multiple />)
        .simulate('click')

      dropdownMenuIsOpen()

      // choose an item keeps menu open
      domEvent.keyDown(document, { key: 'Enter' })

      dropdownMenuIsOpen()
    })
    it('does not close the menu on clicking on an item', () => {
      wrapperMount(<Dropdown options={options} selection multiple />)
        .simulate('click', nativeEvent)
        .find('DropdownItem')
        .at(_.random(options.length - 1))
        .simulate('click', nativeEvent)

      dropdownMenuIsOpen()
    })
    it('filters active options out of the list', () => {
      // make all the items active, expect to see none in the list
      const value = _.map(options, 'value')
      wrapperShallow(<Dropdown options={options} selection value={value} multiple />)
        .should.not.have.descendants('DropdownItem')
    })
    it('displays a label for active items', () => {
      // select a random item, expect a label with the item's text
      const activeItem = _.sample(options)
      wrapperShallow(<Dropdown options={options} selection value={[activeItem.value]} multiple />)
        .should.have.descendants('Label')

      wrapper
        .find('Label')
        .should.have.prop('content', activeItem.text)
    })
    it('keeps the selection within the range of remaining options', () => {
      // items are removed as they are made active
      // the selection should move if the last item is made active
      wrapperMount(<Dropdown options={options} selection multiple />)

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // activate the last item, removing it from the list
      domEvent.keyDown(document, { key: 'ArrowUp' })

      wrapper
        .should.have.exactly(options.length).descendants('DropdownItem')
      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('selected', true)

      domEvent.keyDown(document, { key: 'Enter' })

      // one item should be gone, and the _new_ last item should be selected
      wrapper
        .should.have.exactly(options.length - 1).descendants('DropdownItem')
      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('selected', true)
    })
    it('has labels with delete icons', () => {
      // add a value so we have a label
      const value = [_.head(options).value]
      wrapperRender(<Dropdown options={options} selection value={value} multiple />)
        .should.have.descendants('.label')

      wrapper
        .find('.label')
        .should.have.descendants('.delete.icon')
    })
    it('enables custom rendering', () => {
      const value = [_.head(options).value]
      const renderLabel = () => ({ content: 'My custom text!', as: 'div' })

      wrapperRender(<Dropdown options={options} selection value={value} multiple renderLabel={renderLabel} />)
        .should.have.descendants('.label')

      const label = wrapper.find('.label')

      label.should.have.text('My custom text!')
      label.should.have.tagName('div')
    })

    describe('selecting items', () => {
      let spy
      beforeEach(() => {
        spy = sandbox.spy()
      })

      it('does not close the menu on clicking on a label', () => {
        const value = _.map(options, 'value')
        const randomIndex = _.random(options.length - 1)

        wrapperMount(<Dropdown options={options} selection multiple value={value} />)
          .simulate('click', nativeEvent)
          .find('Label')
          .at(randomIndex)
          .simulate('click', nativeEvent)

        dropdownMenuIsOpen()
      })

      it('sets label to active', () => {
        const value = _.map(options, 'value')
        const randomIndex = _.random(options.length - 1)

        wrapperMount(<Dropdown options={options} selection multiple value={value} />)
          .simulate('click', nativeEvent)
          .find('Label')
          .at(randomIndex)
          .simulate('click', nativeEvent)

        wrapper
          .find('Label')
          .at(randomIndex)
          .should.have.prop('active', true)
      })

      it('calls onLabelClick', () => {
        const value = _.map(options, 'value')
        const randomIndex = _.random(options.length - 1)
        const randomValue = value[randomIndex]

        wrapperMount(<Dropdown options={options} selection multiple value={value} onLabelClick={spy} />)
          .simulate('click', nativeEvent)
          .find('Label')
          .at(randomIndex)
          .simulate('click', nativeEvent)

        spy.should.have.been.calledWithMatch({}, { value: randomValue })
      })
    })
    describe('removing items', () => {
      it('calls onChange without the clicked value', () => {
        const name = 'my-dropdown'
        const value = _.map(options, 'value')
        const randomIndex = _.random(options.length - 1)
        const randomValue = value[randomIndex]
        const expected = _.without(value, randomValue)
        const spy = sandbox.spy()
        wrapperMount(<Dropdown options={options} selection name={name} value={value} multiple onChange={spy} />)

        wrapper
          .find('.delete.icon')
          .at(randomIndex)
          .simulate('click')

        spy.should.have.been.calledOnce()
        spy.should.have.been.calledWithMatch({}, { name, value: expected })
      })
    })
  })

  describe('removing items on backspace', () => {
    let spy
    beforeEach(() => {
      spy = sandbox.spy()
    })

    it('does nothing without selected items', () => {
      wrapperMount(<Dropdown options={options} selection multiple search onChange={spy} />)

      // open
      wrapper.simulate('click')

      domEvent.keyDown(document, { key: 'Backspace' })

      spy.should.not.have.been.called()
    })
    it('removes the last item when there is no search query', () => {
      const name = 'my-dropdown'
      const value = _.map(options, 'value')
      const expected = _.dropRight(value)
      wrapperMount(<Dropdown options={options} selection name={name} value={value} multiple search onChange={spy} />)

      // open
      wrapper.simulate('click')

      domEvent.keyDown(document, { key: 'Backspace' })

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: expected })
    })
    it('removes the last item when there is no search query when uncontrolled', () => {
      const name = 'my-dropdown'
      const value = _.map(options, 'value')
      const expected = _.dropRight(value)
      wrapperMount(
        <Dropdown options={options} selection name={name} defaultValue={value} multiple search onChange={spy} />
      )

      // open
      wrapper.simulate('click')

      domEvent.keyDown(document, { key: 'Backspace' })

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: expected })

      wrapper
        .state('value')
        .should.deep.equal(expected)
    })
    it('does not remove the last item when there is a search query', () => {
      // search for random item
      const searchQuery = _.sample(options).text
      const value = _.map(options, 'value')
      wrapperMount(<Dropdown options={options} selection value={value} multiple search onChange={spy} />)

      // open and simulate search
      wrapper
        .simulate('click')
        .setState({ searchQuery })

      domEvent.keyDown(document, { key: 'Backspace' })

      spy.should.not.have.been.called()
    })
    it('does not remove items for multiple dropdowns without search', () => {
      const value = _.map(options, 'value')
      wrapperMount(<Dropdown options={options} selection value={value} multiple onChange={spy} />)

      // open
      wrapper.simulate('click')

      domEvent.keyDown(document, { key: 'Backspace' })

      spy.should.not.have.been.called()
    })
  })

  describe('onChange', () => {
    let spy
    beforeEach(() => {
      spy = sandbox.spy()
    })

    it('is called with event and value on item click', () => {
      const name = 'my-dropdown'
      const randomIndex = _.random(options.length - 1)
      const randomValue = options[randomIndex].value
      wrapperMount(<Dropdown options={options} selection onChange={spy} name={name} />)
        .simulate('click')
        .find('DropdownItem')
        .at(randomIndex)
        .simulate('click')

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: randomValue })
    })
    it('is called with event and value when pressing enter on a selected item', () => {
      const name = 'my-dropdown'
      const firstValue = options[0].value
      wrapperMount(<Dropdown options={options} selection onChange={spy} name={name} />)
        .simulate('click')

      domEvent.keyDown(document, { key: 'Enter' })

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: firstValue })
    })
    it('is called with event and value when blurring', () => {
      const name = 'my-dropdown'
      const firstValue = options[0].value
      wrapperMount(<Dropdown options={options} selection onChange={spy} name={name} />)
        .simulate('focus')  // open, highlights first item
        .simulate('blur')   // blur should activate selected item

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: firstValue })
    })
    it('is not called on blur when closed', () => {
      wrapperMount(<Dropdown options={options} selection open={false} onChange={spy} />)
        .simulate('focus')
        .simulate('blur')

      spy.should.not.have.been.called()
    })
    it('is not called on blur when selectOnBlur is false', () => {
      wrapperMount(<Dropdown options={options} selection onChange={spy} selectOnBlur={false} />)
        .simulate('focus')
        .simulate('click')

      wrapper.simulate('blur')

      spy.should.not.have.been.called()
    })
    it('is not called on blur with multiple select', () => {
      wrapperMount(<Dropdown options={options} selection onChange={spy} multiple />)
        .simulate('focus')
        .simulate('click')

      wrapper.simulate('blur')

      spy.should.not.have.been.called()
    })
    it('is not called when updating the value prop', () => {
      const value = _.sample(options).value
      const next = _.sample(_.without(options, value)).value

      wrapperMount(<Dropdown options={options} selection value={value} onChange={spy} />)
        .setProps({ value: next })

      spy.should.not.have.been.called()
    })
  })

  describe('onSearchChange', () => {
    it('is called with (event, value) on search input change', () => {
      const spy = sandbox.spy()
      wrapperMount(<Dropdown options={options} search selection onSearchChange={spy} />)
        .find('input.search')
        .simulate('change', { target: { value: 'a' }, stopPropagation: _.noop })

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({ target: { value: 'a' } }, 'a')
    })
  })

  describe('options', () => {
    it('adds the onClick handler to all items', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .find('DropdownItem')
        .everyWhere(item => item.should.have.prop('onClick'))
    })
    it('calls handleItemClick when an item is clicked', () => {
      wrapperMount(<Dropdown options={options} selection />)

      const instance = wrapper.instance()
      sandbox.spy(instance, 'handleItemClick')

      // open
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      instance.handleItemClick.should.not.have.been.called()

      // click random item
      wrapper
        .find('DropdownItem')
        .at(_.random(0, options.length - 1))
        .simulate('click')

      instance.handleItemClick.should.have.been.calledOnce()
    })
    it('renders new options when options change', () => {
      const customOptions = [
        { text: 'abra', value: 'abra' },
        { text: 'cadabra', value: 'cadabra' },
        { text: 'bang', value: 'bang' },
      ]
      wrapperMount(
        <Dropdown options={customOptions} />
      )
        .find('input.search')

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(3)

      wrapper.setProps({ options: [...customOptions, { text: 'bar', value: 'bar' }] })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(4)

      const newItem = wrapper
        .find('DropdownItem')
        .last()

      newItem.should.have.prop('text', 'bar')
      newItem.should.have.prop('value', 'bar')
    })

    it('passes options as props', () => {
      const customOptions = [
        { text: 'abra', value: 'abra', 'data-foo': 'someValue' },
        { text: 'cadabra', value: 'cadabra', 'data-foo': 'someValue' },
        { text: 'bang', value: 'bang', 'data-foo': 'someValue' },
      ]
      wrapperShallow(<Dropdown options={customOptions} selection />)
        .find('DropdownItem')
        .everyWhere(item => item.should.have.prop('data-foo', 'someValue'))
    })
  })

  describe('selection', () => {
    it('does not add a hidden select by default', () => {
      wrapperMount(<Dropdown />)
        .should.not.have.descendants('select[type="hidden"]')
    })
    it('adds a hidden select', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .should.have.exactly(1).descendants('select[type="hidden"]')
    })
    it('passes the name prop to the hidden select', () => {
      wrapperShallow(<Dropdown name='foo' options={options} selection />)
        .find('select[type="hidden"]').should.have.prop('name', 'foo')
    })
    it('passes the value prop to the hidden select', () => {
      const value = _.values(options)

      wrapperShallow(<Dropdown name='foo' value={value} options={options} selection />)
        .find('select[type="hidden"][name="foo"]').should.have.prop('value', value)
    })
    it('passes the multiple prop to the hidden select', () => {
      const selector = 'select[type="hidden"][name="foo"]'

      wrapperShallow(<Dropdown name='foo' multiple options={options} selection />)
        .find(selector).should.have.prop('multiple', true)

      wrapperShallow(<Dropdown name='foo' multiple={false} options={options} selection />)
        .find(selector).should.have.prop('multiple', false)
    })
    it('adds options to the hidden select', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .should.have.exactly(options.length + 1).descendants('option')

      options.forEach((opt, i) => {
        // index is incremented to exclude the empty option value
        const optionElement = wrapper.find('option').at(i + 1)

        optionElement.should.have.prop('value', opt.value)
        optionElement.should.have.text(opt.text)
      })
    })
  })

  describe('search', () => {
    it('does not add a search input when not defined', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .should.not.have.descendants('input.search')
    })

    it('adds a search input when present', () => {
      wrapperShallow(<Dropdown options={options} selection search />)
        .should.have.exactly(1).descendants('input.search')
    })

    it('adds the name prop to the search input', () => {
      wrapperShallow(<Dropdown name='foo' options={options} selection search />)
        .should.have.descendants('input.search')

      wrapper.find('input.search').should.have.prop('name', 'foo-search')
    })

    it('sets focus to the search input on open', () => {
      wrapperMount(<Dropdown options={options} selection search />)
        .simulate('click')

      const activeElement = document.activeElement
      const searchIsFocused = activeElement === document.querySelector('input.search')
      searchIsFocused.should.be.true(
        `Expected "input.search" to be the active element but found ${activeElement} instead.`
      )
    })

    it('removes Dropdown tabIndex', () => {
      wrapperShallow(<Dropdown options={options} selection search />)
        .should.not.have.prop('tabIndex')
    })

    it('has a search input with a tabIndex of 0', () => {
      wrapperShallow(<Dropdown options={options} selection search />)
        .find('input.search')
        .should.have.prop('tabIndex', '0')
    })

    it('has a search input props-defined tabIndex', () => {
      wrapperShallow(<Dropdown options={options} selection search tabIndex='123' />)
        .find('input.search')
        .should.have.prop('tabIndex', '123')
    })

    it('clears the search query when an item is selected', () => {
      // search for random item
      const searchQuery = _.sample(options).text

      wrapperMount(<Dropdown options={options} selection search />)

      // open and simulate search
      wrapper
        .simulate('click')
        .setState({ searchQuery })

      // click first item (we searched for exact text)
      wrapper
        .find('DropdownItem')
        .first()
        .simulate('click')

      // bye bye search query
      wrapper.should.have.state('searchQuery', '')
    })

    it('opens the menu on change if there is a query and not already open', () => {
      wrapperMount(<Dropdown options={options} selection search />)

      dropdownMenuIsClosed()

      // simulate search
      wrapper
        .find('input.search')
        .simulate('change', { target: { value: faker.hacker.noun() } })

      dropdownMenuIsOpen()
    })

    it('does not call onChange on query change', () => {
      const onChangeSpy = sandbox.spy()
      wrapperMount(<Dropdown options={options} selection search onChange={onChangeSpy} />)

      // simulate search
      wrapper
        .find('input.search')
        .simulate('change', { target: { value: faker.hacker.noun() } })

      onChangeSpy.should.not.have.been.called()
    })

    it('filters the items based on display text', () => {
      const search = wrapperMount(<Dropdown options={options} selection search />)
        .find('input.search')

      // search for value yields 0 results
      search.simulate('change', { target: { value: _.sample(options).value } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(0, "Searching for an item's value did not yield 0 results.")

      // search for text yields 1 result
      search.simulate('change', { target: { value: _.sample(options).text } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1, "Searching for an item's text did not yield any results.")
    })

    it('filters the items based on custom search function', () => {
      const searchFunction = sandbox.stub().returns(options.slice(0, 2))
      const search = wrapperMount(<Dropdown options={options} selection search={searchFunction} />)
        .find('input.search')
      const searchQuery = '__nonExistingSearchQuery__'

      // search for value yields 2 results as per our custom search function
      search.simulate('change', { target: { value: searchQuery } })

      searchFunction.should.have.been.calledOnce()
      searchFunction.should.have.been.calledWithMatch(options, searchQuery)

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(2, 'Searching with custom search function did not yield 2 results.')
    })

    it('sets the selected item to the first search result', () => {
      const search = wrapperMount(<Dropdown options={options} selection search />)
        .find('input.search')

      // the first item is selected by default
      // avoid it to prevent false positives

      wrapper.setState({ selectedIndex: _.random(1, options.length - 2) })

      search.simulate('change', { target: { value: faker.hacker.noun() } })

      wrapper.should.have.state('selectedIndex', 0)
    })

    it('still allows moving selection after blur/focus', () => {
      // open, first item is selected
      const search = wrapperMount(<Dropdown options={options} selection search />)
        .simulate('click')

      dropdownMenuIsOpen()

      const items = wrapper
        .find('DropdownItem')

      items
        .first()
        .should.have.prop('selected', true)

      // blur, focus, open, move item selection down
      search
        .simulate('blur')
        .simulate('focus')

      domEvent.keyDown(document, { key: 'ArrowDown' })

      items
        .first()
        .should.have.prop('selected', false)

      items
        .at(1)
        .should.have.prop('selected', true)

      // blur, focus, open, move item selection up
      search
        .simulate('blur')
        .simulate('focus')

      domEvent.keyDown(document, { key: 'ArrowUp' })

      items
        .first()
        .should.have.prop('selected', true)

      items
        .at(1)
        .should.not.have.prop('selected', true)
    })
  })

  describe('no results message', () => {
    it('is shown when a search yields no results', () => {
      const search = wrapperMount(<Dropdown options={options} selection search />)
        .find('input.search')

      wrapper
        .find('.message')
        .should.not.be.present()

      // search for something we know will not exist
      search.simulate('change', { target: { value: '_________________' } })

      wrapper
        .find('.message')
        .should.be.present()
    })

    it('is not shown on multiple dropdowns with no remaining items', () => {
      // make all the items active so there are no remaining options
      const value = _.map(options, 'value')
      wrapperMount(<Dropdown options={options} selection value={value} multiple />)

      // open the menu
      wrapper.simulate('click')
      dropdownMenuIsOpen()

      // confirm there are no items
      wrapper
        .should.not.have.descendants('DropdownItem')

      // expect no message
      wrapper
        .find('.message')
        .should.not.be.present()
    })

    it('uses default noResultsMessage', () => {
      const search = wrapperMount(<Dropdown options={options} selection search />)
        .find('input.search')

      // search for something we know will not exist
      search.simulate('change', { target: { value: '_________________' } })

      wrapper
        .find('.message')
        .should.have.text('No results found.')
    })

    it('uses custom noResultsMessage', () => {
      const search = wrapperMount(<Dropdown options={options} selection search noResultsMessage='Something custom' />)
        .find('input.search')

      // search for something we know will not exist
      search.simulate('change', { target: { value: '_________________' } })

      wrapper
        .find('.message')
        .should.have.text('Something custom')
    })

    it('uses no noResultsMessage', () => {
      const search = wrapperMount(<Dropdown options={options} selection search noResultsMessage='' />)
        .find('input.search')

      // search for something we know will not exist
      search.simulate('change', { target: { value: '_________________' } })

      wrapper
        .find('.message')
        .should.have.text('')
    })
  })

  describe('placeholder', () => {
    it('is present when defined', () => {
      wrapperShallow(<Dropdown options={options} selection placeholder='hi' />)
        .should.have.descendants('.default.text')
    })
    it('is not present when not defined', () => {
      wrapperShallow(<Dropdown options={options} selection />)
        .should.not.have.descendants('.default.text')
    })
    it('is not present when there is a value', () => {
      wrapperShallow(<Dropdown options={options} selection value='hi' placeholder='hi' />)
        .should.not.have.descendants('.default.text')
    })
    it('is present on a multiple dropdown with an empty value array', () => {
      wrapperShallow(<Dropdown options={options} selection multiple placeholder='hi' />)
        .should.have.descendants('.default.text')
    })
    it('has a filtered className when there is a search query', () => {
      wrapperShallow(<Dropdown options={options} selection search placeholder='hi' />)
        .setState({ searchQuery: 'a' })
        .should.have.descendants('.default.text.filtered')
    })
  })

  describe('render', () => {
    it('calls renderText', () => {
      wrapperShallow(<Dropdown options={options} selection />)

      const instance = wrapper.instance()
      sandbox.spy(instance, 'renderText')

      instance.renderText
        .should.not.have.been.called()

      instance.render()

      instance.renderText
        .should.have.been.called()
    })
  })

  describe('Dropdown.Menu child', () => {
    it('renders child passed', () => {
      wrapperShallow(
        <Dropdown text='required prop'>
          <Dropdown.Menu data-find-me />
        </Dropdown>
      )
        .should.contain.descendants('DropdownMenu')

      wrapper
        .find('DropdownMenu')
        .should.have.prop('data-find-me', true)
    })

    it('opens on click', () => {
      wrapperMount(
        <Dropdown text='required prop'>
          <Dropdown.Menu />
        </Dropdown>
      )

      dropdownMenuIsClosed()
      wrapper.simulate('click')
      dropdownMenuIsOpen()
    })

    it('spreads extra menu props', () => {
      wrapperShallow(
        <Dropdown text='required prop'>
          <Dropdown.Menu data-foo-bar />
        </Dropdown>
      )
        .should.contain.descendants('DropdownMenu')

      wrapper
        .find('DropdownMenu')
        .should.have.prop('data-foo-bar', true)
    })

    it("merges the user's menu className", () => {
      wrapperShallow(
        <Dropdown text='required prop'>
          <Dropdown.Menu className='foo-bar' />
        </Dropdown>
      )
        .should.contain.descendants('DropdownMenu')

      const menu = wrapper
        .find('DropdownMenu')
        .shallow()

      menu.should.have.className('menu')
      menu.should.have.className('foo-bar')
    })
  })

  describe('allowAdditions', () => {
    const customOptions = [
      { text: 'abra', value: 'abra' },
      { text: 'cadabra', value: 'cadabra' },
      { text: 'bang', value: 'bang' },
    ]

    it('adds an option for arbitrary search value', () => {
      const search = wrapperMount(<Dropdown options={customOptions} selection search allowAdditions />)
        .find('input.search')

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(3)

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1)

      wrapper
        .find('DropdownItem')
        .should.have.prop('value', 'boo')
    })

    it('adds an option for prefix search value', () => {
      const search = wrapperMount(<Dropdown options={customOptions} selection search allowAdditions />)
        .find('input.search')

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(3)

      search.simulate('change', { target: { value: 'a' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(4)

      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('value', 'a')
    })

    it('uses default additionLabel', () => {
      const search = wrapperMount(<Dropdown options={customOptions} selection search allowAdditions />)
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('className', 'addition')

      const text = wrapper
        .find('DropdownItem')
        .prop('text')

      expect(text[0]).to.equal('Add ')
      shallow(text[1]).equals(<b key='addition'>boo</b>)
    })

    it('uses custom additionLabel string', () => {
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions additionLabel='New: ' />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('className', 'addition')

      const text = wrapper
        .find('DropdownItem')
        .prop('text')

      expect(text[0]).to.equal('New: ')
      shallow(text[1]).equals(<b key='addition'>boo</b>)
    })

    it('uses custom additionLabel element', () => {
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions additionLabel={<i>New: </i>} />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('className', 'addition')

      const text = wrapper
        .find('DropdownItem')
        .prop('text')

      shallow(text[0]).equals(<i key='label'>New: </i>)
      shallow(text[1]).equals(<b key='addition'>boo</b>)
    })

    it('uses no additionLabel', () => {
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions additionLabel='' />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(1)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('className', 'addition')

      const text = wrapper
        .find('DropdownItem')
        .prop('text')

      expect(text[0]).to.equal('')
      shallow(text[1]).equals(<b key='addition'>boo</b>)
    })

    it('keeps custom value option (bottom) when options change', () => {
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions additionPosition='bottom' />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'a' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(4)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('value', 'a')

      wrapper.setProps({ options: [...customOptions, { text: 'bar', value: 'bar' }] })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(5)

      wrapper
        .find('DropdownItem')
        .last()
        .should.have.prop('value', 'a')
    })

    it('keeps custom value option (top) when options change', () => {
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'a' } })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(4)

      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('value', 'a')

      wrapper.setProps({ options: [...customOptions, { text: 'bar', value: 'bar' }] })

      wrapper
        .find('DropdownItem')
        .should.have.lengthOf(5)

      wrapper
        .find('DropdownItem')
        .first()
        .should.have.prop('value', 'a')
    })

    it('calls onAddItem prop when clicking new value', () => {
      const spy = sandbox.spy()
      const name = 'my-dropdown'
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions onAddItem={spy} name={name} />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })

      wrapper
        .find('DropdownItem')
        .first()
        .simulate('click')

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: 'boo' })
    })

    it('calls onAddItem prop when pressing enter on new value', () => {
      const spy = sandbox.spy()
      const name = 'my-dropdown'
      const search = wrapperMount(
        <Dropdown options={customOptions} selection search allowAdditions onAddItem={spy} name={name} />
      )
        .find('input.search')

      search.simulate('change', { target: { value: 'boo' } })
      domEvent.keyDown(document, { key: 'Enter' })

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch({}, { name, value: 'boo' })
    })
  })

  describe('header', () => {
    it('renders a header when present', () => {
      const text = faker.hacker.phrase()

      wrapperRender(<Dropdown options={options} header={text} />)
        .find('.menu .header')
        .should.contain.text(text)
    })
    it('does not render a header when not present', () => {
      wrapperRender(<Dropdown options={options} />)
        .should.not.have.descendants('.menu .header')
    })
  })

  describe('value validations', () => {
    it('logs an error if dropdown is not multiple and value is array', () => {
      consoleUtil.disableOnce()
      const spy = sandbox.spy(console, 'error')

      const originalValue = _.pick(options, 'value')[0]
      const nextValue = _.castArray(_.pick(options, 'value')[1])

      wrapperMount(<Dropdown options={options} value={originalValue} selection />)
      wrapper.setProps({ value: nextValue })

      const errorMessage =
        'Dropdown `value` must not be an array when `multiple` is not set.' +
        ' Either set `multiple={true}` or use a string or number value.'

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch(errorMessage)
    })

    it('logs an error if dropdown is multiple and value not array', () => {
      consoleUtil.disableOnce()
      const spy = sandbox.spy(console, 'error')

      const originalValue = _.castArray(_.pick(options, 'value')[0])
      const nextValue = _.pick(options, 'value')[1]

      wrapperMount(<Dropdown options={options} value={originalValue} selection multiple />)
      wrapper.setProps({ value: nextValue })

      const errorMessage =
        'Dropdown `value` must be an array when `multiple` is set.' +
        ` Received type: \`${Object.prototype.toString.call(nextValue)}\`.`

      spy.should.have.been.calledOnce()
      spy.should.have.been.calledWithMatch(errorMessage)
    })
  })
})
