// File:///home/rose/BOT/SuryaRB/Message/Features/sticker.js
import Sticker from "../../Libs/Sticker.js";

export default {
	command: ["sticker", "stiker", "s"],
	description: "Create a sticker",
	category: "Stickers",
	owner: false,
	admin: false,
	hidden: false,
	limit: 0,

	// we are know all of the parameters from the handler
	execute: async function (m, { sock }) {
		const q = m.quoted ? m.quoted : m;
		const mime = q.mtype || "";
		if (!/webp|image|video|webm/g.test(mime)) {
			return m.reply("Please reply/send a image with the command");
		}
		const image = await q.download();
		const sticker = await Sticker.create(image, {
			packname: "SuryaRB",
			author: "SuryaRB acikiwir",
			emojis: "🤣",
		});
		await sock.sendMessage(m.chat, { sticker: sticker }, { quoted: m });
	},
	failed: "Failed to execute the %cmd command\n%error",
	wait: null,
	done: null,
};
