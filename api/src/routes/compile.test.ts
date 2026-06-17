import { describe, expect, it } from 'vitest'
import { compileHandler } from './compile'
import {
  makeCompileRequestBody,
  makeCompileRequestBodyMissingSource,
} from '../tests/factories/compileRequestBody.factory'
import { makeJsonRequest } from '../tests/factories/request.factory'
import { getLastCompileCall, resetLastCompileCall } from '../test-support/engineShim'

const sourceWithCollapsedSubtreeCandidate = [
  'org "Test"',
  '  ~dept Team Staf @staf',
  '    ~dept Team Leijdal @ld',
  '      ~staff Person A @person_a',
  '      ~dept SubTeam @ld_sub',
  '        ~staff Person B @person_b',
  '    ~dept Team Groene Beemden @gb',
  '      ~staff Person C @person_c',
].join('\n')

const sourceWithCollapsedSubtreePruned = [
  'org "Test"',
  '  ~dept Team Staf @staf',
  '    ~dept Team Leijdal @ld',
  '      ~staff Person A @person_a',
  '    ~dept Team Groene Beemden @gb',
  '      ~staff Person C @person_c',
].join('\n')

const collapsedSubtreeCompileRequestBody = {
  ...makeCompileRequestBody({
    source: sourceWithCollapsedSubtreeCandidate,
  }),
  effectiveSubtreeIds: ['staf'],
  collapsedSubtreeRootIds: ['ld'],
} as const

const expectedCompileCallForCollapsedSubtree = {
  source: sourceWithCollapsedSubtreePruned,
  renderConfig: expect.any(Object),
  options: {
    ignoreSourceStyle: false,
    subtreeIds: ['staf'],
  },
} as const

describe('compileHandler visual-hint suppression for basic requests', () => {
  it('suppresses icon and !new visual hints when requested', async () => {
    resetLastCompileCall()

    const req = makeJsonRequest({
      path: '/api/compile',
      body: {
        ...makeCompileRequestBody({ source: 'org "Test"\n  Alice @alice !new' }),
        suppressVisualHints: true,
      },
    })

    const res = await compileHandler(req)
    const compileCall = getLastCompileCall()

    expect(res.status).toBe(200)
    expect(compileCall).toEqual({
      source: 'org "Test"\n  Alice @alice',
      renderConfig: expect.objectContaining({
        showSubordinateCount: false,
      }),
      options: {
        ignoreSourceStyle: false,
        styleSource: 'style\n  .node\n    icon-opacity: 0',
      },
    })
  })
})

describe('compileHandler visual-hint suppression for style merging', () => {
  it('suppresses multiple !new variants and merges with style source', async () => {
    resetLastCompileCall()

    const req = makeJsonRequest({
      path: '/api/compile',
      body: {
        ...makeCompileRequestBody({ source: 'Alice !new\nBob !new:urgent\nCarol !new' }),
        styleSource: 'style\n  .node\n    color: #ff0000',
        suppressVisualHints: true,
      },
    })

    const res = await compileHandler(req)
    const compileCall = getLastCompileCall()

    expect(res.status).toBe(200)
    expect(compileCall).toEqual({
      source: 'Alice\nBob\nCarol',
      renderConfig: expect.objectContaining({
        showSubordinateCount: false,
      }),
      options: {
        ignoreSourceStyle: false,
        styleSource: 'style\n  .node\n    color: #ff0000\n\nstyle\n  .node\n    icon-opacity: 0',
      },
    })
  })
})

describe('compileHandler basic responses', () => {
  it('returns 200 when compile succeeds', async () => {
    const req = makeJsonRequest({
      path: '/api/compile',
      body: makeCompileRequestBody({ source: 'org "Test"' }),
    })

    const res = await compileHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when source is missing', async () => {
    const req = makeJsonRequest({
      path: '/api/compile',
      body: makeCompileRequestBodyMissingSource(),
    })

    const res = await compileHandler(req)

    expect(res.status).toBe(422)
  })
})

const sourceWithHeadedCollapsedSubtree = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub [head: @lead]',
  '      Lead @lead',
  '      Other @other',
].join('\n')

const sourceWithHeadedCollapsedSubtreePruned = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub [head: @lead]',
  '      Lead @lead',
].join('\n')

const sourceWithCrossReferencedHead = [
  'org "Test"',
  '  ~dept Parent @parent [head: @staff_b]',
  '    ~dept Child @child',
  '      Staff A @staff_a',
  '      Staff B @staff_b',
].join('\n')

const sourceWithCrossReferencedHeadPruned = [
  'org "Test"',
  '  ~dept Parent @parent',
  '    ~dept Child @child',
  '      Staff A @staff_a',
].join('\n')

const sourceWithShadowAndCollapsedSubtree = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Virtual @virt [type: virtual]',
  '      ~shadow @virt_a [primary: @person_a, label: member]',
  '      ~shadow @virt_b [primary: @person_b, label: member]',
  '    ~dept Active @active',
  '      Person A @person_a',
  '    ~dept Collapsed @collapsed [head: @first]',
  '      First @first',
  '      Person B @person_b',
].join('\n')

const sourceWithShadowAndCollapsedSubtreePruned = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Virtual @virt [type: virtual]',
  '      ~shadow @virt_a [primary: @person_a, label: member]',
  '    ~dept Active @active',
  '      Person A @person_a',
  '    ~dept Collapsed @collapsed [head: @first]',
  '      First @first',
].join('\n')

const sourceWithLinksAndCollapsedSubtree = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub',
  '      Ronald @ronald',
  '      Lea @lea',
  'links',
  '  @ronald --> @lea [label: reports]',
  '  @lea --> @ronald [label: mentors]',
].join('\n')

const sourceWithLinksAndCollapsedSubtreePruned = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub',
  '      Ronald @ronald',
  'links',
].join('\n')

const sourceWithNoHeadCollapsedSubtree = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub',
  '      First @first',
  '      Other @other',
].join('\n')

const sourceWithNoHeadCollapsedSubtreePruned = [
  'org "Test"',
  '  ~dept Team @team',
  '    ~dept Sub @sub',
  '      First @first',
].join('\n')

describe('compileHandler collapsed subtree source pruning', () => {
  it('prunes descendants from collapsed subtree roots before compile', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({ path: '/api/compile', body: collapsedSubtreeCompileRequestBody })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()).toEqual(expectedCompileCallForCollapsedSubtree)
  })

  it('keeps the declared head person of a collapsed dept to preserve valid BTL', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({
      path: '/api/compile',
      body: { ...makeCompileRequestBody({ source: sourceWithHeadedCollapsedSubtree }), collapsedSubtreeRootIds: ['sub'] },
    })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()?.source).toBe(sourceWithHeadedCollapsedSubtreePruned)
  })

  it('strips [head: @handle] when the head is a non-head pruned person from another collapsed dept', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({
      path: '/api/compile',
      body: { ...makeCompileRequestBody({ source: sourceWithCrossReferencedHead }), collapsedSubtreeRootIds: ['child'] },
    })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()?.source).toBe(sourceWithCrossReferencedHeadPruned)
  })
})

describe('compileHandler collapsed subtree cross-reference cleanup', () => {
  it('removes link lines referencing pruned handles', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({
      path: '/api/compile',
      body: { ...makeCompileRequestBody({ source: sourceWithLinksAndCollapsedSubtree }), collapsedSubtreeRootIds: ['sub'] },
    })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()?.source).toBe(sourceWithLinksAndCollapsedSubtreePruned)
  })

  it('removes shadow nodes whose [primary: @handle] references a pruned handle', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({
      path: '/api/compile',
      body: { ...makeCompileRequestBody({ source: sourceWithShadowAndCollapsedSubtree }), collapsedSubtreeRootIds: ['collapsed'] },
    })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()?.source).toBe(sourceWithShadowAndCollapsedSubtreePruned)
  })

  it('keeps the first person of a headless collapsed dept to preserve valid BTL', async () => {
    resetLastCompileCall()
    const req = makeJsonRequest({
      path: '/api/compile',
      body: { ...makeCompileRequestBody({ source: sourceWithNoHeadCollapsedSubtree }), collapsedSubtreeRootIds: ['sub'] },
    })
    const res = await compileHandler(req)
    expect(res.status).toBe(200)
    expect(getLastCompileCall()?.source).toBe(sourceWithNoHeadCollapsedSubtreePruned)
  })
})
