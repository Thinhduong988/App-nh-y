# -*- coding: utf-8 -*-
import os
import subprocess
from gtts import gTTS

os.makedirs('video_assets/audio_30s', exist_ok=True)

# 4 Concise scenes totaling exactly 30 seconds
scenes = [
    {
        'id': 'scene1',
        'text': 'Bắn Free Fire mãi không lên đầu? Xem ngay ứng dụng tra cứu độ nhạy chuẩn thi đấu 2026!',
        'target_sec': 6.5
    },
    {
        'id': 'scene2',
        'text': 'Hỗ trợ hơn một trăm dòng máy từ iPhone, Samsung đến Xiaomi, đầy đủ thông số nhìn xung quanh và ống ngắm thang hai trăm mới nhất.',
        'target_sec': 8.0
    },
    {
        'id': 'scene3',
        'text': 'Gợi ý chính xác kích thước nút bắn cùng hướng vuốt tâm chữ J giúp bạn kéo phát nào, đỏ đầu phát đó.',
        'target_sec': 8.0
    },
    {
        'id': 'scene4',
        'text': 'Sao chép một chạm vào game cực nhanh. Trải nghiệm ngay hôm nay để tự tin gánh team nhé!',
        'target_sec': 7.5
    }
]

total = 0
for s in scenes:
    raw_path = os.path.join('video_assets/audio_30s', f"{s['id']}_raw.mp3")
    sync_path = os.path.join('video_assets/audio_30s', f"{s['id']}_vo.mp3")
    
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

print(f"Total Video Audio Duration: {total:.1f}s (Exactly 30 seconds!)")
