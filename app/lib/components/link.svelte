<script>
  import { isOpenedOutside } from '#lib/utils'
  import { icon as iconFn } from '#lib/handlebars_helpers/icons'
  import assert_ from '#lib/assert_types'

  export let url
  export let text = null
  export let html = null
  export let icon = null
  export let title = ''
  export let light = false
  export let dark = false
  export let grey = false
  export let classNames
  export let tinyButton = false
  export let stopClickPropagation = true

  assert_.string(url)

  const isExternalLink = url?.[0] !== '/'
  let target, rel
  if (isExternalLink) {
    target = '_blank'
    rel = 'noopener'
  }

  if (text && !title) title = text

  function onClick (e) {
    if (stopClickPropagation) e.stopPropagation()
    if (!(isExternalLink || isOpenedOutside(e))) {
      app.navigateAndLoad(url)
      e.preventDefault()
    }
  }
</script>

<a
  href={url}
  {title}
  {target}
  {rel}
  class:light
  class:dark
  class:grey
  class:tiny-button={tinyButton}
  class={classNames}
  on:click={onClick}
>
  {#if icon}{@html iconFn(icon)}{/if}
  {#if html}
    {@html html}
  {:else if text}
    <span class="link-text">{text}</span>
  {/if}
</a>

<style lang="scss">
  @import "#general/scss/utils";

  a:not(.tiny-button){
    &.light{
      @include link-light;
    }
    &.dark{
      @include link-dark;
    }
    &.grey{
      @include link-underline-on-hover($grey, $dark-grey);
    }
  }
</style>
