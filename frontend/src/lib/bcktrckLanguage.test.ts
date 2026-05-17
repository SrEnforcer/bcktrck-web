import { describe, expect, it } from 'vitest'
import { getBcktrckFoldingRangesForTests, tokenizeBcktrckTextForTests } from './bcktrckLanguage'

describe('bcktrck language tokenizer', () => {
  it('highlights top-level defs, style, and config keywords', () => {
    expect(tokenizeBcktrckTextForTests('defs')).toEqual(['keyword'])
    expect(tokenizeBcktrckTextForTests('style')).toEqual(['keyword'])
    expect(tokenizeBcktrckTextForTests('config')).toEqual(['keyword'])
  })

  it('highlights style variables in definitions and references', () => {
    expect(tokenizeBcktrckTextForTests('  $accent = #e9fff0')).toEqual(['white', 'variable.style', 'white', 'white', 'number.hex'])
    expect(tokenizeBcktrckTextForTests('  background-color: $accent')).toEqual(['white', 'property', 'white', 'variable.style'])
  })

  it('highlights style selectors including node-name and node-title', () => {
    expect(tokenizeBcktrckTextForTests('  .node')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .node-name')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .node-title')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .role-engineer')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .type-virtual')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .type-virtual:children')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  @maya:children')).toEqual(['white', 'variable'])
  })

  it('highlights supported style declarations', () => {
    expect(tokenizeBcktrckTextForTests('    background-color: #e9fff0')).toEqual(['white', 'property', 'white', 'number.hex'])
    expect(tokenizeBcktrckTextForTests('    border-color: #223344')).toEqual(['white', 'property', 'white', 'number.hex'])
    expect(tokenizeBcktrckTextForTests('    border-style: dashed')).toEqual(['white', 'property', 'white', 'keyword.border-style'])
    expect(tokenizeBcktrckTextForTests('    border-width: 3')).toEqual(['white', 'property', 'white', 'number'])
    expect(tokenizeBcktrckTextForTests('    edge-style: straight')).toEqual(['white', 'property', 'white', 'keyword.edge-style'])
    expect(tokenizeBcktrckTextForTests('    edge-width: 1.5px')).toEqual(['white', 'property', 'white', 'number'])
    expect(tokenizeBcktrckTextForTests('    color: #4a4a4a')).toEqual(['white', 'property', 'white', 'number.hex'])
    expect(tokenizeBcktrckTextForTests('    font-size: 12px')).toEqual(['white', 'property', 'white', 'number'])
    expect(tokenizeBcktrckTextForTests('    font-weight: bold')).toEqual(['white', 'property', 'white', 'keyword'])
  })

  it('highlights common style values', () => {
    expect(tokenizeBcktrckTextForTests('    background-color: #e9fff0')).toContain('number.hex')
    expect(tokenizeBcktrckTextForTests('    font-size: 12px')).toContain('number')
    expect(tokenizeBcktrckTextForTests('    line-spacing: 1.35')).toEqual(['white', 'property', 'white', 'number'])
    expect(tokenizeBcktrckTextForTests('    font-weight: bold')).toContain('keyword')
    expect(tokenizeBcktrckTextForTests('    font-weight: 700')).toEqual(['white', 'property', 'white', 'keyword'])
  })

  it('keeps org syntax highlighting intact', () => {
    expect(tokenizeBcktrckTextForTests('org "Backtrack Labs"')).toEqual(['keyword', 'white', 'string'])
    expect(tokenizeBcktrckTextForTests('  Maya Singh @maya [title: CEO]')).toEqual(['white', 'white', 'white', 'variable', 'white', 'type'])
    expect(tokenizeBcktrckTextForTests('links')).toEqual(['keyword'])
    expect(tokenizeBcktrckTextForTests('  @maya --> @ravi [label: mentoring]')).toEqual(['white', 'variable', 'white', 'operator', 'white', 'variable', 'white', 'type'])
  })

  it('highlights new .kind-* selectors and style values', () => {
    expect(tokenizeBcktrckTextForTests('  .kind-department')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .kind-shared:children')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .kind-staff')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('  .kind-dept')).toEqual(['white', 'selector'])
    expect(tokenizeBcktrckTextForTests('    border-style: none')).toEqual(['white', 'property', 'white', 'keyword.border-style'])
    expect(tokenizeBcktrckTextForTests('    background-color: transparent')).toEqual(['white', 'property', 'white', 'keyword'])
  })

  it('highlights comments, strings, node kinds, and attribute names', () => {
    const slash = String.fromCharCode(92)
    expect(tokenizeBcktrckTextForTests('  // style note')).toEqual(['comment'])
    expect(tokenizeBcktrckTextForTests('~dept Engineering')).toEqual(['keyword', 'white'])
    expect(tokenizeBcktrckTextForTests('[title: CEO]')).toEqual(['type'])
    expect(tokenizeBcktrckTextForTests('title: CEO')).toEqual(['attribute.name', 'white'])
    expect(tokenizeBcktrckTextForTests(`org "Escaped ${slash}"Name${slash}""`)).toEqual(['keyword', 'white', 'string'])
  })
})

describe('bcktrck folding ranges', () => {
  it('finds separate folding ranges for defs, style, and org root blocks', () => {
    const source = `defs
  $eng = engineer

style
  .type-virtual:children
    edge-style: dotted

org "Acme"
  Team @team
    Alice @alice`

    expect(getBcktrckFoldingRangesForTests(source)).toEqual([
      { start: 1, end: 2, kind: 'region' },
      { start: 4, end: 6, kind: 'region' },
      { start: 8, end: 10, kind: 'region' }
    ])
  })

  it('ignores single-line root keywords without an indented body', () => {
    const source = `style

org "Acme"
  Team @team`

    expect(getBcktrckFoldingRangesForTests(source)).toEqual([
      { start: 3, end: 4, kind: 'region' }
    ])
  })
})