import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RibbonGroup from '../RibbonGroup.vue'
import RibbonButton from '../RibbonButton.vue'
import RibbonToggle from '../RibbonToggle.vue'

// ──────────────────────────────────────────────
// RibbonGroup
// ──────────────────────────────────────────────
describe('RibbonGroup', () => {
  it('renders the label prop', () => {
    const wrapper = mount(RibbonGroup, { props: { label: 'NEW' } })
    expect(wrapper.text()).toContain('NEW')
  })

  it('renders the title prop (backward compat)', () => {
    const wrapper = mount(RibbonGroup, { props: { title: 'FILE' } })
    expect(wrapper.text()).toContain('FILE')
  })

  it('label takes precedence over title', () => {
    const wrapper = mount(RibbonGroup, { props: { label: 'LABEL', title: 'TITLE' } })
    expect(wrapper.text()).toContain('LABEL')
    expect(wrapper.text()).not.toContain('TITLE')
  })

  it('renders slot content', () => {
    const wrapper = mount(RibbonGroup, {
      props: { label: 'TEST' },
      slots: { default: '<button class="slot-btn">Slot</button>' },
    })
    expect(wrapper.find('.slot-btn').exists()).toBe(true)
  })
})

// ──────────────────────────────────────────────
// RibbonButton
// ──────────────────────────────────────────────
describe('RibbonButton', () => {
  it('renders the label', () => {
    const wrapper = mount(RibbonButton, { props: { icon: 'zoom-in', label: 'Zoom In' } })
    expect(wrapper.text()).toContain('Zoom In')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(RibbonButton, { props: { icon: 'zoom-in', label: 'Zoom In' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders an icon component (svg present)', () => {
    const wrapper = mount(RibbonButton, { props: { icon: 'pan', label: 'Pan' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('falls back to Square icon for unknown icon key', () => {
    // Should mount without error even with unknown key
    const wrapper = mount(RibbonButton, { props: { icon: 'unknown-icon-xyz', label: 'Test' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

// ──────────────────────────────────────────────
// RibbonToggle
// ──────────────────────────────────────────────
describe('RibbonToggle', () => {
  it('renders the label', () => {
    const wrapper = mount(RibbonToggle, { props: { icon: 'pan', label: 'Pan', modelValue: false } })
    expect(wrapper.text()).toContain('Pan')
  })

  it('does not have active class when modelValue is false', () => {
    const wrapper = mount(RibbonToggle, { props: { icon: 'pan', label: 'Pan', modelValue: false } })
    expect(wrapper.classes()).not.toContain('active')
  })

  it('has active class when modelValue is true', () => {
    const wrapper = mount(RibbonToggle, { props: { icon: 'pan', label: 'Pan', modelValue: true } })
    expect(wrapper.classes()).toContain('active')
  })

  it('emits update:modelValue with toggled value on click', async () => {
    const wrapper = mount(RibbonToggle, { props: { icon: 'pan', label: 'Pan', modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })
})
