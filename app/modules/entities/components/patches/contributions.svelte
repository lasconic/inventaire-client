<script>
  import InfiniteScroll from '#components/infinite_scroll.svelte'
  import { serializePatches } from '#entities/lib/patches'
  import Flash from '#lib/components/flash.svelte'
  import preq from '#lib/preq'
  import { getlocalTimeString, timeFromNow } from '#lib/time'
  import { loadInternalLink } from '#lib/utils'
  import { i18n, I18n } from '#user/lib/i18n'
  import Contribution from '#entities/components/patches/contribution.svelte'

  export let user = null
  export let filter = null

  let contributions = []
  const userContributionsContext = user != null

  let fetching = false
  let limit = 10
  let offset = 0
  let flash, hasMore, total

  async function fetchMore () {
    limit = Math.min(limit * 2, 500)
    const { patches, continue: continu, total: _total } = await preq.get(app.API.entities.contributions({
      userId: user?._id,
      limit,
      offset,
      filter,
    }))
    hasMore = continu != null
    offset = continu
    total = _total
    contributions = contributions.concat(await serializePatches(patches))
  }

  async function keepScrolling () {
    if (fetching || hasMore === false) return false
    fetching = true
    try {
      await fetchMore()
      return true
    } catch (err) {
      flash = err
      return false
    } finally {
      fetching = false
    }
  }

  function removeFilter () {
    app.navigateAndLoad(user.contributionsPathname)
  }
</script>

<div class="contributions">
  <h3>
    {#if user}
      {I18n('contributions_by', user)}
    {:else}
      {I18n('recent changes')}
    {/if}
    {#if filter}
      <span class="filter">
        {filter}
        <button class="remove-filter" title={I18n('remove filter')} on:click={removeFilter}>&#215;</button>
      </span>
    {/if}
  </h3>

  <ul class="stats">
    {#if user}
      <li>
        <span class="stat-label">id</span>
        <span class="stat-value">{user._id}</span>
      </li>
      {#if !user.special}
        <li>
          <span class="stat-label">{i18n('profile')}</span>
          <a class="link" href={user.pathname} on:click={loadInternalLink}>{user.username}</a>
        </li>
        <li>
          {#if user.deleted}
            <span class="stat-label deleted">{i18n('deleted')}</span>
          {:else}
            <span class="stat-label">{i18n('created')}</span>
            <p class="stat-value">
              <span class="time-from-now">{timeFromNow(user.created)}</span>
              <span class="precise-time">{getlocalTimeString(user.created)}</span>
            </p>
          {/if}
        </li>
      {/if}
      {#if user.roles}
        <li>
          <span class="stat-label">{i18n('roles')}:</span>
          <span class="stat-value">{user.roles}</span>
        </li>
      {/if}
    {/if}
    {#if total}
      <li>
        <span class="stat-label">{i18n('total')}</span>
        <span class="stat-value total">{total}</span>
      </li>
    {/if}
  </ul>
</div>

<Flash state={flash} />

<InfiniteScroll {keepScrolling} showSpinner={true}>
  <ul class="contributions-list">
    {#each contributions as patch}
      <Contribution {patch} {userContributionsContext} />
    {/each}
  </ul>
</InfiniteScroll>

<style lang="scss">
  @import "#general/scss/utils";

  .contributions, .contributions-list{
    margin: 0 auto;
    max-width: 100em;
    overflow: hidden;
    @include display-flex(column, center, center);
  }
  h3{
    text-align: center;
    @include display-flex(row, center, center);
    .filter{
      margin: 0 1em;
      @include display-flex(row, center, center);
      @include sans-serif;
      background-color: $light-blue;
      padding-inline-start: 0.2rem;
      font-size: 1rem;
      border-radius: $global-radius;
      color: white;
    }
    .remove-filter{
      @include tiny-button($light-blue);
      font-size: 1.5rem;
      line-height: 1rem;
      padding: 0.5rem;
      align-self: stretch;
    }
  }
  .stats{
    padding: 1em;
    background-color: $light-grey;
    .stat-label{
      display: inline-block;
      min-width: 10em;
      color: #777;
      &.deleted{
        color: red;
        font-weight: bold;
      }
    }
  }
  .stat-value{
    display: inline-block;
  }
  .precise-time{
    margin-inline-start: 0.5em;
    color: $grey;
  }
  .contributions-list{
    margin-block-start: 1em;
    align-self: stretch;
    @include display-flex(column, stretch, center);
  }
</style>
