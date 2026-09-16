import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillMethodChooser from '@/components/Skill/SkillMethodChooser.vue'

describe('SkillMethodChooser', () => {
  it('兩張卡：對話／積木，點擊 emit choose', async () => {
    const w = mount(SkillMethodChooser)
    const cards = w.findAll('.smc-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('用對話建立')
    expect(cards[1].text()).toContain('用行銷積木組裝')
    await cards[0].trigger('click')
    await cards[1].trigger('click')
    expect(w.emitted('choose')).toEqual([['chat'], ['blocks']])
  })
})
