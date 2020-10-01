import error_ from 'lib/error'
import dataURLtoBlob from 'blueimp-canvas-to-blob'

const images_ = {
  addDataUrlToArray (file, array, event) {
    return resize.photo(file, 600, 'dataURL', data => {
      array.unshift(data)
      if ((array.trigger != null) && (event != null)) { return array.trigger(event) }
    })
  },

  getUrlDataUrl (url) {
    return _.preq.get(app.API.images.dataUrl(url))
    .get('data-url')
  },

  getUserGravatarUrl () {
    return _.preq.get(app.API.images.gravatar)
    .get('url')
  },

  getElementDataUrl ($el) {
    // requires the source to be on the same domain
    // or served with appropriate CORS headers.
    // can be overpassed by using a proxy: see {{proxySrc}}
    return $el.toDataURL()
  },

  resizeDataUrl (dataURL, maxSize, outputQuality = 1) {
    return new Promise((resolve, reject) => {
      const data = { original: {}, resized: {} }
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = image
        saveDimensions(data, 'original', width, height);
        [ width, height ] = Array.from(getResizedDimensions(width, height, maxSize))
        saveDimensions(data, 'resized', width, height)

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(image, 0, 0, width, height)
        data.dataUrl = canvas.toDataURL('image/jpeg', outputQuality)
        return resolve(data)
      }

      // This exact message is expected by the Img model
      image.onerror = e => reject(new Error('invalid image'))

      image.src = dataURL
    })
  },

  dataUrlToBlob: data => {
    if (_.isDataUrl(data)) return dataURLtoBlob(data)
    else throw new Error('expected a dataURL')
  },

  upload (container, blobsData, hash = false) {
    blobsData = _.forceArray(blobsData)
    const formData = new FormData()

    let i = 0
    for (const blobData of blobsData) {
      let { blob, id } = blobData
      if (blob == null) { throw error_.new('missing blob', blobData) }
      if (!id) { id = `file-${++i}` }
      formData.append(id, blob)
    }

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          const { status, statusText } = request
          if (/^2/.test(request.status.toString())) {
            return resolve(request.response)
          } else {
            return reject(error_.new(statusText, status))
          }
        }
      }
      request.onerror = reject
      request.ontimeout = reject

      request.open('POST', app.API.images.upload(container, hash))
      request.responseType = 'json'
      return request.send(formData)
    })
  },

  getImageHashFromDataUrl (container, dataUrl) {
    if (!_.isDataUrl(dataUrl)) { throw error_.new('invalid image', dataUrl) }
    return images_.upload(container, { blob: images_.dataUrlToBlob(dataUrl) }, true)
    .then(res => _.values(res)[0].split('/').slice(-1)[0])
  },

  getNonResizedUrl (url) { return url.replace(/\/img\/users\/\d+x\d+\//, '/img/') },

  getColorSquareDataUri (colorHash) {
    // Using the base64 version and not the utf8, as it gets problematic
    // when used as background-image '<div style="background-image: url({{imgSrc picture 100}})"'
    const base64Hash = btoa(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><path d='M0,0h1v1H0' fill='#${colorHash}'/></svg>`)
    return `data:image/svg+xml;base64,${base64Hash}`
  },

  getColorSquareDataUriFromModelId (modelId) {
    const colorHash = getFilterColor(modelId)
    return images_.getColorSquareDataUri(colorHash)
  }
}

const getResizedDimensions = function (width, height, maxSize) {
  if (width > height) {
    if (width > maxSize) {
      height *= maxSize / width
      width = maxSize
    }
  } else {
    if (height > maxSize) {
      width *= maxSize / height
      height = maxSize
    }
  }
  return [ width, height ]
}

const saveDimensions = function (data, attribute, width, height) {
  data[attribute].width = width
  data[attribute].height = height
}

// Inspired by https://www.materialpalette.com/colors
const colorFilters = [
  '009688',
  '00bcd4',
  '03a9f4',
  '2196f3',
  '3f51b5',
  '4caf50',
  '607d8b',
  '673ab7',
  '795548',
  '8bc34a',
  '9c27b0',
  '9e9e9e',
  'cddc39'
]

const getFilterColor = function (modelId) {
  if (modelId == null) { return colorFilters[0] }
  const someStableModelNumber = parseInt(modelId.slice(-2), 16)
  // Pick one of the colors based on the group slug length
  const index = someStableModelNumber % colorFilters.length
  return colorFilters[index]
}

export default images_
