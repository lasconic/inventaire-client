<script>
  import Spinner from '#general/components/spinner.svelte'
  import { getSubEntitiesSections } from '#entities/components/lib/entities'
  import { byPublicationDate } from '#entities/lib/entities'
  import { omitNonInfoboxClaims } from '#entities/components/lib/work_helpers'
  import BaseLayout from './base_layout.svelte'
  import Infobox from './infobox.svelte'
  import EntityTitle from './entity_title.svelte'
  import EntityImage from '../entity_image.svelte'
  import HomonymDeduplicates from './deduplicate_homonyms.svelte'
  import WorksBrowser from '#entities/components/layouts/works_browser.svelte'
  import { setContext } from 'svelte'
  import { extendedAuthorsKeys } from '#entities/lib/show_all_authors_preview_lists'
  import MissingEntitiesMenu from '#entities/components/layouts/missing_entities_menu.svelte'
  import Summary from '#entities/components/layouts/summary.svelte'
  import RelativeEntitiesList from '#entities/components/layouts/relative_entities_list.svelte'
  import { i18n } from '#user/lib/i18n'
  import { isNonEmptyPlainObject } from '#lib/boolean_tests'
  import { getEntityMetadata } from '#entities/lib/document_metadata'
  import { getRelativeEntitiesListLabel, getRelativeEntitiesProperties } from '#entities/components/lib/relative_entities_helpers.js'
  import { onChange } from '#lib/svelte/svelte'
  import { debounce } from 'underscore'

  export let entity, standalone
  let flash

  const { uri, type } = entity
  app.navigate(`/entity/${uri}`, { metadata: getEntityMetadata(entity) })

  setContext('layout-context', 'author')
  const authorProperties = Object.keys(extendedAuthorsKeys)

  setContext('search-filter-claim', authorProperties.map(property => `${property}=${uri}`).join('|'))
  setContext('search-filter-types', [ 'series', 'works' ])
  const createButtons = [
    { type: 'serie', claims: { 'wdt:P50': [ uri ] } },
    { type: 'work', claims: { 'wdt:P50': [ uri ] } },
  ]

  let sections, waitingForSubEntities
  function getSections () {
    waitingForSubEntities = getSubEntitiesSections({ entity, sortFn: byPublicationDate })
      .then(res => sections = res)
      .catch(err => flash = err)
  }

  const lazyGetSections = debounce(getSections, 100)
  $: if (entity) onChange(entity, lazyGetSections)
</script>

<BaseLayout
  bind:entity
  {standalone}
  bind:flash
>
  <div class="entity-layout" slot="entity">
    <div class="top-section">
      <div class="work-section">
        <EntityTitle {entity} {standalone} />
        <div class="infobox-and-summary">
          {#if isNonEmptyPlainObject(entity.image)}
            <EntityImage
              {entity}
              size={192}
            />
          {/if}
          <Infobox
            claims={omitNonInfoboxClaims(entity.claims)}
            entityType={entity.type}
          />
          <Summary {entity} />
        </div>
      </div>
      <div class="author-works">
        {#await waitingForSubEntities}
          <Spinner center={true} />
        {:then}
          <WorksBrowser {sections} />
        {/await}
      </div>
    </div>
    <!-- waiting for subentities to not display relative entities list before work browser -->
    <!-- to not having to push them down while work broser is being displayed -->
    {#await waitingForSubEntities then}
      <MissingEntitiesMenu
        waiting={waitingForSubEntities}
        questionText="A series or a work by this author is missing in the common database?"
        {createButtons}
      />
      <div class="relatives-lists">
        <RelativeEntitiesList
          {entity}
          property={[ 'wdt:P2679', 'wdt:P2680' ]}
          label={i18n('editions_prefaced_or_postfaced_by_author', { name: entity.label })}
        />
        {#each getRelativeEntitiesProperties(type) as property}
          <RelativeEntitiesList
            {entity}
            {property}
            label={getRelativeEntitiesListLabel({ property, entity })}
          />
        {/each}
      </div>
      <HomonymDeduplicates {entity} />
    {/await}
  </div>
</BaseLayout>

<style lang="scss">
  @import "#general/scss/utils";
  @import "#entities/scss/relatives_lists";
  .entity-layout{
    align-self: stretch;
    @include display-flex(column, stretch);
    :global(.summary.has-summary){
      margin-block-start: 1em;
    }
  }
  .author-works{
    margin-block-start: 1em;
  }
  .infobox-and-summary{
    :global(.entity-image){
      margin-inline-end: 1em;
    }
  }
  /* Large screens */
  @media screen and (min-width: $small-screen){
    .infobox-and-summary{
      @include display-flex(row, flex-start, flex-start);
      :global(.claims-infobox-wrapper), :global(.summary){
        inline-size: 50%;
      }
      :global(.claims-infobox){
        margin-inline-end: 1em;
        margin-block-end: 1em;
      }
      :global(.summary.has-summary){
        margin-block-start: 0;
      }
    }
    .relatives-lists{
      @include display-flex(row, baseline, flex-start, wrap);
      $margin: 1rem;
      // Hide the extra margin on each wrapped line
      margin-inline-end: -$margin;
      :global(.relative-entities-list.not-empty){
        flex: 1 0 40%;
        margin-inline-end: $margin;
        margin-block-end: $margin;
      }
    }
  }
</style>
