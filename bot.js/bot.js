const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const app = express()
let pairingCode = 'انتظر...'
let connected = false

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), browser: ["Lancelot", "Chrome", "1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u) => {
    if (u.connection === 'open') { connected = true; pairingCode = 'متصل ✅' }
    if (u.connection === 'close') { connected = false }
  })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    let m = messages[0]
    if (!m.message || m.key.fromMe) return
    let text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    let from = m.key.remoteJid

    if (text === '/موجود') {
      await sock.sendMessage(from, { text: 'موجود وكله زي الفل يا بطل 🔥' })
    }
    if (text === '/'بوت) {
      await sock.sendMessage(from, { text: 'انا النيزك موجود لمساعدتك يا بطل' })
    }
  })
  global.sock = sock
}
start()

app.get('/', (req, res) => {
  res.send(`<h1 style="text-align:center;font-family:sans-serif">Lancelot Bot 🤖</h1><p style="text-align:center">الحالة: ${connected ? 'متصل ✅' : 'غير متصل'}</p><p style="text-align:center;font-size:30px">الكود: <b>${pairingCode}</b></p><form style="text-align:center" action="/pair"><input name="num" placeholder="201126599973" style="padding:10px"><button style="padding:10px">اطلب كود</button></form>`)
})
app.get('/pair', async (req, res) => {
  try {
    let num = req.query.num
    pairingCode = await global.sock.requestPairingCode(num)
    res.redirect('/')
  } catch(e) { res.send('حاول مرة ثانية بعد 10 ثواني') }
})
app.listen(process.env.PORT || 3000, () => console.log('Web شغال'))
