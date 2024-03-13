// File://home/rose/BOT/SuryaRB/Message/Features/gfp_superres.js
import Uploader from "../../Libs/Uploader.js";

export default {
	command: ["gfp_superres", "gfpsuper"],
	description: "Enhance image to HD using GFP Super Resolution.",
	category: "Image",
	owner: false,
	admin: false,
	hidden: false,
	limit: false,
	group: false,
	private: false,

	execute: async function (m, { sock, api, args }) {
		const q = m.quoted ? m.quoted : m;
		const mime = q.mtype || "";
		if (!/image/g.test(mime)) {
			return m.reply("Please reply/send a image with the command");
		}
		const outscale = args[0] || 5; // default is 5 (if u without using value), usage: gfpsuper <value>
		const media = await q.download();
		const buffer = Buffer.isBuffer(media) ? media : Buffer.from(media, "utf-8");
		const url = await Uploader.providers.telegraph.upload(buffer);
		const { data } = await api.post("/image/gfp_superres", {
			init_image: url,
			outscale,
		});

		const { status, message, result } = data;

		if (!status) {
			return m.reply(message);
		}

		await sock.sendMessage(
			m.chat,
			{ image: { url: result.images } },
			{ quoted: m }
		);
	},
	failed: "Failed to execute the %cmd command\n%error",
	wait: ["Please wait %tag", "Hold on %tag, fetching response"],
	done: null,
};
