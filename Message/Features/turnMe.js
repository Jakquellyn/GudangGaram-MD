// File: /home/rose/BOT/SuryaRB/Message/Features/turnMe.js
import { telegraph } from "../../Libs/Uploader.js";

export default {
	command: ["turnme"],
	description: "Turning image to any styles.",
	category: "Image",
	owner: false,
	admin: false,
	hidden: false,
	limit: false,
	group: false,
	private: false,

	/**
	 * @param {import("../../Utils/Messages").ExtendedWAMessage} m - The message object.
	 * @param {import("../Handler").miscOptions} options - The options.
	 */
	execute: async function (m, { sock, api, args }) {
		const q = m.quoted ? m.quoted : m;
		const mime = q.mtype || "";
		if (!/image/g.test(mime)) {
			return m.reply("Please reply/send a image with the command");
		}
		const media = await q.download();
		const buffer = Buffer.isBuffer(media) ? media : Buffer.from(media, "utf-8");
		const url = await telegraph.upload(buffer);
		const [style = "anime", ...prompt] = args;
		if (!style) {
			return m.reply("Please provide both style");
		}
		const { data } = await api.post("/image/turnMe", {
			init_image: url,
			style,
			skin: "default",
			image_num: 4,
			prompt: prompt.join(" "),
			strength: 0.6,
		});

		const { status, message, result, styles } = data;

		if (!status) {
			if (styles && Array.isArray(styles)) {
				let extra_msg =
					"Available styles:\n\n" +
					styles.map((style, index) => `${index + 1}. ${style}`).join("\n");
				m.reply(extra_msg);
			} else {
				m.reply(message);
			}
			return;
		}
		for (const url of result.images) {
			await sock.sendMessage(m.chat, { image: { url } }, { quoted: m });
		}
	},
	failed: "Failed to execute the %cmd command\n%error",
	wait: ["Please wait %tag", "Hold on %tag, fetching response"],
	done: null,
};
