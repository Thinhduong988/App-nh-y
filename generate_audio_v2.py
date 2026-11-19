# -*- coding: utf-8 -*-
import os
import subprocess
from gtts import gTTS

os.makedirs('video_assets/audio_v2', exist_ok=True)

# 1 Single consistent female voice across all scenes, concise and focused on sensitivity
scenes = [
    {
        'id': 'scene1',
        'text': 'Xin chào các bạn! Nếu bạn đang bắn Free Fire mà kéo tâm hay bị trượt hoặc khựng đạn, thì đây là ứng dụng tra cứu độ nhạy chuẩn thi đấu dành cho bạn.',
        'target_sec': 10.0
    },
    {
        'id': 'scene2',
        'text': 'Ứng dụng hỗ trợ hơn một trăm dòng máy từ iPhone, Samsung, Xiaomi đến ROG Phone. Chỉ cần chọn đúng dòng máy bạn đang dùng là có ngay bảng độ nhạy tối ưu nhất.',
        'target_sec': 13.0
    },
    {
        'id': 'scene3',
        'text': 'Mọi thông số đều được cập nhật theo thang đo hai trăm mới nhất, từ nhìn xung quanh, red dot đến ống ngắm 2x và 4x, giúp tâm bắn vừa tay và cực kỳ ổn định.',
        'target_sec': 13.0
    },
    {
        'id': 'scene4',
        'text': 'Đặc biệt, ứng dụng gợi ý luôn kích thước nút bắn chuẩn theo phần trăm, cùng hướng dẫn kéo thẳng khi bắn tầm xa hoặc vuốt chữ J khi bắn cận chiến để dễ dàng One-shot.',
        'target_sec': 13.0
    },
    {
        'id': 'scene5',
        'text': 'Chỉ với một chạm là bạn đã sao chép xong độ nhạy để cài vào game. Hãy trải nghiệm ngay hôm nay để kéo tâm mượt hơn và tự tin gánh team nhé!',
        'target_sec': 11.0
    }
]

total = 0
for s in scenes:
    raw_path = os.path.join('video_assets/audio_v2', f"{s['id']}_raw.mp3")
    sync_path = os.path.join('video_assets/audio_v2', f"{s['id']}_vo.mp3")
    
    tts = gTTS(s['text'], lang='vi')
    tts.save(raw_path)
    
    res = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', raw_path], capture_output=True, text=True)
    raw_dur = float(res.stdout.strip())
    speed = raw_dur / s['target_sec']
    print(f"{s['id']}: raw={raw_dur:.2f}s, target={s['target_sec']:.2f}s, speed={speed:.2f}x")
    
    subprocess.run([
        'ffmpeg', '-y', '-i', raw_path,
        '-filter:a', f'atempo={speed:.3f}',
        sync_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    total += s['target_sec']

print(f"Total Video Audio Duration: {total:.1f}s (Exactly 1 minute!)")
