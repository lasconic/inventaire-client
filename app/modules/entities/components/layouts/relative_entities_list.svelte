<script>
  import { i18n } from '#user/lib/i18n'
  import { isNonEmptyArray } from '#lib/boolean_tests'
  import { forceArray } from '#lib/utils'
  import { uniq, indexBy } from 'underscore'
  import Spinner from '#components/spinner.svelte'
  import { getEntitiesAttributesByUris, getReverseClaims, serializeEntity } from '#entities/lib/entities'
  import { addEntitiesImages } from '#entities/lib/types/work_alt'
  import Flash from '#lib/components/flash.svelte'
  import SectionLabel from '#entities/components/layouts/section_label.svelte'
  import RelativeEntityLayout from '#entities/components/layouts/relative_entity_layout.svelte'
  import { onScrollToBottom } from '#lib/screen'

  export let entity, property, label, claims

  let flash
  let uris

  const { uri } = entity

  async function getUris () {
    let allUris
    if (claims) {
      allUris = claims
    } else {
      const properties = forceArray(property)
      allUris = await Promise.all(properties.map(property => {
        return getReverseClaims(property, uri)
      }))
    }
    uris = uniq(allUris.flat())
  }

  const waiting = getUris()

  async function getAndSerializeEntities (uris) {
    return getEntitiesAttributesByUris({
      uris,
      // TODO: also request 'popularity' to be able to use it to sort the entities
      attributes: [ 'info', 'labels', 'image' ],
      lang: app.user.lang,
    })
      .then(async res => {
        const entities = Object.values(res.entities).map(serializeEntity)
        await addEntitiesImages(entities)
        return indexBy(entities, 'uri')
      })
      .catch(err => flash = err)
  }

  let entitiesByUris = []
  let loadingMore, displayedUris

  async function getMissingEntities () {
    if (uris?.length > 0) displayedUris = uris.slice(0, displayLimit)
    if (isNonEmptyArray(displayedUris)) {
      let missingUris
      missingUris = displayedUris.filter(uri => !entitiesByUris[uri])
      if (missingUris.length === 0) return
      loadingMore = getAndSerializeEntities(missingUris)
      const missingEntities = await loadingMore
      entitiesByUris = { ...entitiesByUris, ...missingEntities }
    }
  }

  // Limit needs to be high enough for a large screen element to be scrollable
  // otherwise on:scroll wont be triggered
  let displayLimit = 45
  function displayMore () { displayLimit += 10 }
  const lazyDisplay = _.debounce(displayMore, 300)
  $: displayLimit && getMissingEntities()
</script>

{#await waiting}
  <Spinner center={true} />
{:then}
  {#if displayedUris?.length > 0}
    <div class="relative-entities-list">
      <SectionLabel
        {label}
        {property}
        {uri}
        entitiesLength={uris.length}
      />
      <ul on:scroll={onScrollToBottom(lazyDisplay)}>
        {#each displayedUris as uri}
          <RelativeEntityLayout
            {uri}
            {entitiesByUris}
          />
        {/each}
        {#await loadingMore}
          <Spinner />
          {i18n('loading')}
        {/await}
      </ul>
    </div>
  {/if}
{/await}
<Flash state={flash} />

<style lang="scss">
  @import "#general/scss/utils";
  $card-height: 8rem;
  .relative-entities-list{
    padding: 0.5rem;
    background-color: $off-white;
    margin-block-end: 0.5em;
  }
  ul{
    @include display-flex(row, center, null, wrap);
    max-block-size: calc($card-height * 2 + 3em);
    overflow-y: auto;
  }
</style>
