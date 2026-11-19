# -*- coding: utf-8 -*-
import os
import asyncio
import edge_tts
from gtts import gTTS
import subprocess

os.makedirs("video_assets/audio", exist_ok=True)

# 5 Scenes for a 1-minute intro video (each ~11-13s)
scenes = [
    {
        "id": "scene1",
        "name": "Mở đầu - Vấn đề & Giới thiệu App",
        "text": "Bắn Free Fire mãi mà tâm vẫn khựng, trượt đầu hay bắn toàn trúng người? Đừng lo! Đã có Ứng dụng Độ Nhạy Free Fire Pro 2026. Bí quyết kéo tâm đỏ rực, chuẩn thi đấu Esports số một hiện nay!",
        "target_sec": 11
    },
    {
        "id": "scene2",
        "name": "Kho độ nhạy 100+ dòng máy",
        "text": "Khám phá kho dữ liệu khổng lồ tối ưu cho hơn một trăm dòng máy: từ iPhone, Samsung, Xiaomi, POCO đến ROG Phone. Mọi thông số từ Nhìn Xung Quanh, Red Dot đến Ống Ngắm 2x, 4x đều được chuẩn hóa theo thang hai trăm mới nhất!",
        "target_sec": 13
    },
    {
        "id": "scene3",
        "name": "Mô phỏng nút bắn & Kéo tâm chữ J",
        "text": "Đặc biệt: Tính năng mô phỏng kích thước nút bắn chuẩn từng phần trăm! Kèm theo chỉ dẫn hướng kéo tâm trực quan: kéo thẳng khi bắn tầm xa hoặc vuốt chữ J cận chiến. Bắn phát nào, đỏ đầu phát đó!",
        "target_sec": 13
    },
    {
        "id": "scene4",
        "name": "AI Sensitivity Generator 5D",
        "text": "Chưa hết đâu nhé! Thuật toán AI Sensitivity sẽ phân tích cấu hình máy, tần số quét màn hình từ 60Hz đến 120Hz và phong cách chơi One-shot hay Sấy SMG để tạo ra bộ độ nhạy riêng biệt cho chính bạn!",
        "target_sec": 12
    },
    {
        "id": "scene5",
        "name": "Quản lý cấu hình & Kêu gọi tải",
        "text": "Lưu cấu hình không giới hạn, sao chép một chạm gửi đồng đội cực nhanh! Tải và trải nghiệm ngay hôm nay để làm chủ mọi trận chiến. Bắn là gục, kéo là đỏ!",
        "target_sec": 11
    }
]

async def try_edge_tts(text, out_path):
    try:
        c = edge_tts.Communicate(text, "vi-VN-HoaiMyNeural", rate="+10%")
        await c.save(out_path)
        return True
    except Exception as e:
        print(f"Edge TTS fallback due to: {e}")
        return False

def gen_gtts(text, out_path):
    # generate with gtts
    tmp = out_path + ".tmp.mp3"
    tts = gTTS(text, lang='vi')
    tts.save(tmp)
    # speed up slightly with ffmpeg atempo to match dynamic pace
    subprocess.run([
        'ffmpeg', '-y', '-i', tmp,
        '-filter:a', 'atempo=1.12',
        out_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(tmp):
        os.remove(tmp)

async def main():
    print("--- Generating Female Voiceovers for 5 Scenes ---")
    for s in scenes:
        out_file = os.path.join("video_assets/audio", f"{s['id']}_vo.mp3")
        ok = await try_edge_tts(s["text"], out_file)
        if not ok:
            print(f"Using gTTS for {s['id']}...")
            gen_gtts(s["text"], out_file)
        
        # Get duration
        res = subprocess.run([
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            out_file
        ], capture_output=True, text=True)
        dur = float(res.stdout.strip()) if res.stdout.strip() else 0.0
        print(f"[{s['id']}] Duration: {dur:.2f}s | Target: {s['target_sec']}s")

if __name__ == "__main__":
    asyncio.run(main())
