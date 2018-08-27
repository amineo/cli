const Command = require('../../base')
const { getAddons, createAddon } = require('../../utils/api/addons')
const parseRawFlags = require('../../utils/parseRawFlags')

class addonsCreateCommand extends Command {
  async run() {
    await this.authenticate()
    const { args, raw } = this.parse(addonsCreateCommand)
    const accessToken = this.global.get('accessToken')

    if (!accessToken) {
      this.error(`Not logged in`)
    }

    const addonName = args.name

    const siteId = this.site.get('siteId')

    if (!siteId) {
      console.log('No site id found, please run inside a site folder or `netlify link`')
      return false
    }

    const site = await this.netlify.getSite({ siteId })
    // console.log(site)
    const addons = await getAddons(siteId, accessToken)

    if (typeof addons === 'object' && addons.error) {
      console.log('API Error', addons)
      return false
    }

    // Filter down addons to current args.name
    const currentAddon = addons.reduce((acc, current) => {
      // return current addon
      if (current.service_path && (current.service_path.replace('/.netlify/', '')) === addonName) {
        return current
      }
      return {}
    }, addons)

    // GET flags from `raw` data
    const rawFlags = parseRawFlags(raw)

    if (currentAddon.id) {
      console.log(`Addon ${addonName} already exists for ${site.name}`)
      console.log(`> Run \`netlify addons:update ${addonName}\` to update settings`)
      console.log(`> Run \`netlify addons:delete ${addonName}\` to delete this addon`)
      return false
    }

    const settings = {
      siteId: siteId,
      addon: addonName,
      config: rawFlags
    }
    const addonResponse = await createAddon(settings, accessToken)

    if (addonResponse.code === 404) {
      console.log(`No addon "${addonName}" found. Please double check your addon name and try again`)
      return false
    }
    this.log(`Addon "${addonName}" created for ${site.name}`)
    // console.log(addonResponse)
  }
}

addonsCreateCommand.description = `Add an addon extension to your site
...
Addons are a way to extend the functionality of your Netlify site
`


addonsCreateCommand.args = [
  {
    name: 'name',
    required: true,
    description: 'addon namespace',
  }
]


// allow for any flags. Handy for variadic configuration options
addonsCreateCommand.strict = false

addonsCreateCommand.hidden = true

module.exports = addonsCreateCommand
