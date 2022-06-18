import { attachCommandListeners, initialize } from './startup'

initialize().then(() => {
  attachCommandListeners()
})
