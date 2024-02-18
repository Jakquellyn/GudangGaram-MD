// File://home/rose/BOT/SuryaRB/Utils/Messages.js
import {
	getContentType,
	jidNormalizedUser,
	downloadContentFromMessage,
} from "@whiskeysockets/baileys";
import fs from "node:fs/promises";

import { mimeMap } from "./Medias.js";

const downloadMedia = async (message, pathFile) => {
	const type = Object.keys(message)[0];
	try {
		const stream = await downloadContentFromMessage(message[type], mimeMap[type]);
		const buffer = [];
		for await (const chunk of stream) {
			buffer.push(chunk);
		}
		if (pathFile) {
			await fs.promises.writeFile(pathFile, Buffer.concat(buffer));
			return pathFile;
		} else {
			return Buffer.concat(buffer);
		}
	} catch (e) {
		throw e;
	}
};

/**
 * @typedef ExtendedWAMessage
 * @property {string} chat
 * @property {string} sender
 * @property {boolean} isGroup
 * @property {string} mtype
 * @property {string} text
 * @property {import("@whiskeysockets/baileys").proto.IMessageContextInfo} contextInfo
 * @property {import("@whiskeysockets/baileys").WAMessage} quoted
 * @property {() => Promise<Buffer | null>} download
 * @property {(text: string) => void} reply
 */

/**
 * Process the incoming message and return an extended WAMessage object.
 * @param {import("@whiskeysockets/baileys").BaileysEventMap["messages.upsert"]} upsert - The upsert event object.
 * @param {import("@whiskeysockets/baileys").WASocket} sock - The WASocket object.
 * @returns {import("@whiskeysockets/baileys").WAMessage & ExtendedWAMessage | null} - The extended WAMessage object.
 */
export function Messages(upsert, sock) {
	const { messages } = upsert;
	const m = messages[0];
	if (m.key) {
		const { id, remoteJid } = m.key;
		m.id = id;
		m.isGroup = remoteJid.endsWith("@g.us");
		m.chat = jidNormalizedUser(remoteJid);
		m.sender = jidNormalizedUser(
			m.isGroup ? m.key.participant : m.key.fromMe ? sock.user.id : remoteJid
		);
	}

	if (m.message) {
		m.mtype = getContentType(m.message);

		if (m.mtype === "ephemeralMessage") {
			m.message = m.message[m.mtype].message;
			m.mtype = getContentType(m.message);
			if (m.mtype === "viewOnceMessageV2") {
				m.message = m.message[m.mtype].message;
				m.mtype = getContentType(m.message);
			}
		}
		m.contextInfo = m.message[m.mtype].contextInfo || {};

		try {
			const quoted = m.contextInfo.quotedMessage || null;
			if (quoted) {
				if (quoted.ephemeralMessage) {
					const tipe = Object.keys(quoted.ephemeralMessage.message)[0];
					if (tipe === "viewOnceMessage") {
						m.quoted = {
							sender: jidNormalizedUser(m.contextInfo.participant),
							message: quoted.ephemeralMessage.message.viewOnceMessage.message,
						};
					} else if (tipe === "viewOnceMessageV2") {
						m.quoted = {
							sender: jidNormalizedUser(m.contextInfo.participant),
							message: quoted.ephemeralMessage.message.viewOnceMessageV2.message,
						};
					} else {
						m.quoted = {
							sender: jidNormalizedUser(m.contextInfo.participant),
							message: quoted.ephemeralMessage.message,
						};
					}
				} else {
					m.quoted = {
						sender: jidNormalizedUser(m.contextInfo.participant),
						message: quoted,
					};
				}
				m.quoted.mtype = m.quoted.type = Object.keys(m.quoted.message)[0];
				m.quoted.text =
					m.quoted.message?.conversation ||
					m.quoted.message[m.quoted.mtype]?.text ||
					m.quoted.message[m.quoted.mtype]?.description ||
					m.quoted.message[m.quoted.mtype]?.caption ||
					m.quoted.message[m.quoted.mtype]?.hydratedTemplate?.hydratedContentText ||
					m.quoted.message[m.quoted.mtype] ||
					"";
				m.quoted.key = {
					id: m.contextInfo.stanzaId,
					fromMe: m.sender === jidNormalizedUser(sock.user.id),
					remoteJid: m.sender,
				};
				m.quoted.delete = () => sock.sendMessage(m.chat, { delete: m.quoted.key });
				m.quoted.download = (pathFile) => downloadMedia(m.quoted.message, pathFile);
			} else {
				m.quoted = null;
			}
			m.text =
				m.message[m.mtype]?.caption ||
				m.message[m.mtype]?.text ||
				m.message[m.mtype]?.conversation ||
				m.message?.conversation ||
				"";
			m.reply = (text) =>
				sock.sendMessage(m.chat, { text: String(text) }, { quoted: m });
			m.download = (pathFile) => downloadMedia(m.message, pathFile);
		} catch (error) {
			console.error(error);
		}
	}
	return m;
}
