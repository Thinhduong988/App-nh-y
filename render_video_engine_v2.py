# -*- coding: utf-8 -*-
import os
import math
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30

# Elegant Cyber Theme
BG_DARK = (8, 6, 18)
CYAN = (0, 240, 255)
ORANGE = (255, 98, 0)
GOLD = (255, 184, 0)
WHITE = (255, 255, 255)
TEXT_MUTED = (165, 160, 195)
GREEN = (0, 255, 136)
RED = (255, 59, 48)
CARD_BG = (20, 13, 44)
CARD_BORDER = (55, 35, 105)

FONT_DIR = "C:/Windows/Fonts"
font_title_lg = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 52)
font_title_md = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 38)
font_title_sm = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 28)
font_bold_24 = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 24)
font_bold_20 = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 20)
font_regular_22 = ImageFont.truetype(f"{FONT_DIR}/segoeui.ttf", 22)
font_regular_18 = ImageFont.truetype(f"{FONT_DIR}/segoeui.ttf", 18)

os.makedirs("video_assets/clips_v2", exist_ok=True)

def create_base_canvas():
    """Clean, high-contrast dark space background with subtle neon grid"""
    im = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(im)
    
    # Subtle top ambient glow
    for r in range(350, 0, -50):
        alpha = int(14 * (1.0 - r / 350.0))
        draw.ellipse([WIDTH // 2 - r * 2, -r, WIDTH // 2 + r * 2, r * 2], fill=(alpha, alpha // 2, alpha * 2))

    # Clean grid lines
    for x in range(0, WIDTH, 160):
        draw.line([(x, 0), (x, HEIGHT)], fill=(18, 12, 38), width=1)
    for y in range(0, HEIGHT, 120):
        draw.line([(0, y), (WIDTH, y)], fill=(18, 12, 38), width=1)
        
    return im

BASE_CANVAS = create_base_canvas()

def make_phone_frame(screen_path, target_h=860):
    src = Image.open(screen_path).convert('RGBA')
    w, h = src.size
    aspect = w / h
    target_w = int(target_h * aspect)
    src_resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    pad = 14
    pw = target_w + pad * 2
    ph = target_h + pad * 2
    phone = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(phone)
    
    # Chassis & Glowing borders
    pdraw.rounded_rectangle([0, 0, pw, ph], radius=38, fill=(17, 10, 36, 255), outline=(112, 51, 255, 255), width=3)
    pdraw.rounded_rectangle([3, 3, pw-3, ph-3], radius=35, outline=(255, 98, 0, 160), width=2)
    
    # Screen Mask
    mask = Image.new('L', (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=26, fill=255)
    phone.paste(src_resized, (pad, pad), mask)
    
    # Notch
    notch_w, notch_h = 110, 22
    nx = (pw - notch_w) // 2
    pdraw.rounded_rectangle([nx, pad + 2, nx + notch_w, pad + 2 + notch_h], radius=11, fill=(10, 5, 20, 255), outline=(58, 35, 110, 255), width=1)
    pdraw.ellipse([nx + notch_w - 24, pad + 6, nx + notch_w - 10, pad + 20], fill=(2, 2, 8, 255), outline=(40, 20, 70, 255))
    
    return phone

PHONE_HOME = make_phone_frame("video_assets/screenshots/shot_home.png", 860)
PHONE_SENS = make_phone_frame("video_assets/screenshots/shot_sens.png", 860)
PHONE_DETAIL = make_phone_frame("video_assets/screenshots/shot_detail.png", 860)
PHONE_ACCOUNT = make_phone_frame("video_assets/screenshots/shot_account.png", 860)

def draw_card(draw, box, fill=CARD_BG, outline=CARD_BORDER, radius=18, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def draw_badge(draw, xy, text, font=font_bold_20, bg=(255, 98, 0, 40), fg=ORANGE, border=ORANGE):
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    box = [xy[0], xy[1], xy[0] + tw + 24, xy[1] + th + 14]
    draw.rounded_rectangle(box, radius=8, fill=bg, outline=border, width=1)
    draw.text((xy[0] + 12, xy[1] + 6), text, font=font, fill=fg)
    return box

def draw_progress_bar(draw, box, percent, color=ORANGE, bg=(30, 20, 60)):
    draw.rounded_rectangle(box, radius=8, fill=bg)
    fill_w = int((box[2] - box[0]) * (percent / 100.0))
    if fill_w > 8:
        draw.rounded_rectangle([box[0], box[1], box[0] + fill_w, box[3]], radius=8, fill=color)

# ==================== SCENE 1: MỞ ĐẦU (10.0s = 300 frames) ====================
def render_scene_1(pipe, num_frames=300):
    """Giới thiệu ứng dụng tra cứu độ nhạy Free Fire chuẩn thi đấu"""
    print(f"Rendering Scene 1 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        # Phone on left
        im.paste(PHONE_HOME, (140, 110), PHONE_HOME)
        
        rx = 700
        draw_badge(draw, (rx, 140), "🔥 ỨNG DỤNG ĐỘ NHẠY FREE FIRE 2026", font=font_bold_20, bg=(50, 25, 10), fg=GOLD, border=GOLD)
        
        draw.text((rx, 200), "TRA CỨU ĐỘ NHẠY CHUẨN THI ĐẤU", font=font_title_lg, fill=WHITE)
        draw.text((rx, 275), "Bí quyết giúp kéo tâm đỏ rực, không còn bị khựng đạn hay trượt đầu", font=font_bold_24, fill=CYAN)
        
        # 2 Clean, focused highlight cards
        draw_card(draw, [rx, 360, rx + 1060, 520], fill=CARD_BG, outline=ORANGE)
        draw.text((rx + 35, 395), "🎯 DÀNH CHO GAME THỦ HAY BỊ LỖI KÉO TÂM", font=font_title_sm, fill=ORANGE)
        draw.text((rx + 35, 445), "• Khắc phục triệt để tình trạng tâm dính chặt vào thân địch\n• Giúp tâm bắn mượt mà, dễ dàng kéo lên đầu đối phương", font=font_regular_22, fill=WHITE)
        
        draw_card(draw, [rx, 550, rx + 1060, 710], fill=CARD_BG, outline=CYAN)
        draw.text((rx + 35, 585), "⚡ TỐI ƯU HÓA RIÊNG CHO MỌI THIẾT BỊ", font=font_title_sm, fill=CYAN)
        draw.text((rx + 35, 635), "• Hỗ trợ đầy đủ iPhone, Android, máy yếu đến Flagship cao cấp\n• Cập nhật thông số chuẩn xác theo từng phiên bản Free Fire", font=font_regular_22, fill=WHITE)
        
        draw.text((rx + 150, 780), "⭐ HỖ TRỢ ĐẮC LỰC CHO ANH EM LEO RANK & BẮN GIẢI", font=font_bold_24, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 2: 100+ DÒNG MÁY (13.0s = 390 frames) ====================
def render_scene_2(pipe, num_frames=390):
    """Tra cứu độ nhạy theo hơn 100 dòng máy"""
    print(f"Rendering Scene 2 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_SENS, (140, 110), PHONE_SENS)
        
        rx = 700
        draw_badge(draw, (rx, 140), "📱 KHO DỮ LIỆU ĐA THIẾT BỊ", font=font_bold_20, bg=(20, 30, 60), fg=CYAN, border=CYAN)
        
        draw.text((rx, 200), "HƠN 100+ DÒNG MÁY ĐƯỢC TỐI ƯU", font=font_title_lg, fill=WHITE)
        draw.text((rx, 275), "Chỉ cần chọn đúng dòng máy của bạn là có ngay bộ thông số chuẩn", font=font_bold_24, fill=TEXT_MUTED)
        
        # 4 Brand Categories
        brands = [
            ("🍏 Apple iPhone", "iPhone 11, 12, 13, 14, 15, 16 Pro Max...", GOLD),
            ("📱 Samsung Galaxy", "Dòng Galaxy S Ultra, Z Fold, Dòng Galaxy A...", CYAN),
            ("⚡ Xiaomi & POCO", "Redmi Note, K-Series, POCO F/X Series...", ORANGE),
            ("🎮 ASUS ROG & Gaming", "ROG Phone, REDMAGIC, iQOO, Infinix GT...", GREEN)
        ]
        
        for idx, (bname, bdesc, bcolor) in enumerate(brands):
            cy = 345 + idx * 95
            draw_card(draw, [rx, cy, rx + 1060, cy + 80], fill=CARD_BG, outline=bcolor, radius=14)
            draw.rounded_rectangle([rx, cy, rx + 8, cy + 80], radius=4, fill=bcolor)
            draw.text((rx + 30, cy + 14), bname, font=font_title_sm, fill=bcolor)
            draw.text((rx + 30, cy + 46), bdesc, font=font_regular_18, fill=WHITE)
            
        draw.rounded_rectangle([rx, 750, rx + 1060, 810], radius=12, fill=(30, 20, 50))
        draw.text((rx + 40, 765), "🔍 Tìm kiếm thông minh: Gõ tên máy là ra kết quả ngay lập tức", font=font_bold_20, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 3: THANG ĐO 200 (13.0s = 390 frames) ====================
def render_scene_3(pipe, num_frames=390):
    """Bảng độ nhạy chuẩn thang đo 200 mới nhất"""
    print(f"Rendering Scene 3 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_DETAIL, (140, 110), PHONE_DETAIL)
        
        rx = 700
        draw_badge(draw, (rx, 140), "📊 THÔNG SỐ CHUẨN THI ĐẤU", font=font_bold_20, bg=(50, 25, 10), fg=ORANGE, border=ORANGE)
        
        draw.text((rx, 200), "BẢNG ĐỘ NHẠY THANG ĐO 200 MỚI", font=font_title_lg, fill=WHITE)
        draw.text((rx, 275), "Được tinh chỉnh chuẩn xác giúp tâm vừa tay và cực kỳ ổn định", font=font_bold_24, fill=GOLD)
        
        # 4 Sensitivity Sliders Box
        draw_card(draw, [rx, 340, rx + 1060, 720], fill=CARD_BG, outline=CARD_BORDER, radius=20)
        
        anim_p = min(1.0, f / 40.0)
        sliders = [
            ("👁️ Nhìn Xung Quanh", int(184 * anim_p), 184, CYAN),
            ("🔴 Red Dot Sight", int(172 * anim_p), 172, ORANGE),
            ("🔭 Ống Ngắm 2x", int(166 * anim_p), 166, GOLD),
            ("🎯 Ống Ngắm 4x", int(158 * anim_p), 158, GREEN),
        ]
        
        for i, (label, val, max_val, col) in enumerate(sliders):
            sy = 370 + i * 82
            draw.text((rx + 35, sy), label, font=font_bold_24, fill=WHITE)
            draw_progress_bar(draw, [rx + 300, sy + 6, rx + 880, sy + 28], (val / 200.0) * 100.0, color=col)
            draw.text((rx + 910, sy), f"{val}/200", font=font_bold_24, fill=col)
            
        draw.rounded_rectangle([rx, 750, rx + 1060, 810], radius=12, fill=(20, 35, 45))
        draw.text((rx + 40, 765), "✨ Đã test thực chiến trong game: Kéo tâm êm ái, không bị vọt qua đầu", font=font_bold_20, fill=CYAN)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 4: NÚT BẮN & KÉO CHỮ J (13.0s = 390 frames) ====================
def render_scene_4(pipe, num_frames=390):
    """Mô phỏng nút bắn HUD và hướng vuốt tâm chữ J"""
    print(f"Rendering Scene 4 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_DETAIL, (140, 110), PHONE_DETAIL)
        
        rx = 700
        draw_badge(draw, (rx, 140), "🎯 MÔ PHỎNG NÚT BẮN (HUD) & HƯỚNG VUỐT", font=font_bold_20, bg=(50, 20, 10), fg=ORANGE, border=ORANGE)
        
        draw.text((rx, 200), "KÍCH THƯỚC NÚT BẮN CHUẨN XÁC", font=font_title_lg, fill=WHITE)
        draw.text((rx, 275), "Yếu tố then chốt quyết định 80% tỷ lệ kéo tâm thành công", font=font_bold_24, fill=CYAN)
        
        # Fire button size card
        draw_card(draw, [rx, 340, rx + 1060, 500], fill=CARD_BG, outline=ORANGE, radius=18)
        
        btn_radius = int(45 + 5 * math.sin(f * 0.2))
        bx, by = rx + 110, 420
        draw.ellipse([bx - btn_radius, by - btn_radius, bx + btn_radius, by + btn_radius], fill=(255, 98, 0, 180), outline=GOLD, width=3)
        draw.text((bx - 24, by - 14), "42%", font=font_title_sm, fill=WHITE)
        
        draw.text((rx + 190, 375), "• Cỡ nút chuẩn theo máy: 40% - 46%", font=font_bold_24, fill=WHITE)
        draw.text((rx + 190, 415), "• Tọa độ đặt chuẩn: Đáy 11% • Cách lề phải 18%", font=font_regular_22, fill=CYAN)
        draw.text((rx + 190, 450), "• Tối ưu khoảng trống ngón tay khi vuốt tâm trên màn hình", font=font_regular_18, fill=TEXT_MUTED)
        
        # 2 Gesture cards
        draw_card(draw, [rx, 530, rx + 515, 730], fill=CARD_BG, outline=CYAN, radius=18)
        draw.text((rx + 25, 555), "🔼 KÉO THẲNG (TẦM XA)", font=font_bold_24, fill=CYAN)
        draw.text((rx + 25, 605), "• Sấy M4A1, Scar, MP40 tầm trung & xa\n• Kéo thẳng đều tay từ ngực lên đầu\n• Giữ nhịp ghìm tâm chống rung giật", font=font_regular_18, fill=WHITE)
        
        draw_card(draw, [rx + 545, 530, rx + 1060, 730], fill=CARD_BG, outline=GREEN, radius=18)
        draw.text((rx + 570, 555), "⤴️ VUỐT CHỮ J (CẬN CHIẾN)", font=font_bold_24, fill=GREEN)
        draw.text((rx + 570, 605), "• Dành riêng cho Shotgun M1887, M1014\n• Vuốt nhẹ xuống rồi móc ngược cực nhanh\n• Dễ dàng One-shot gục ngay đối thủ", font=font_regular_18, fill=WHITE)
        
        draw.text((rx + 240, 775), "🏆 TỰ TIN ONE-SHOT • BẮN PHÁT NÀO ĐỎ ĐẦU PHÁT ĐÓ!", font=font_bold_24, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 5: SAO CHÉP & CALL TO ACTION (11.0s = 330 frames) ====================
def render_scene_5(pipe, num_frames=330):
    """Sao chép 1 chạm và vào game trải nghiệm ngay"""
    print(f"Rendering Scene 5 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_ACCOUNT, (140, 110), PHONE_ACCOUNT)
        
        rx = 700
        draw_badge(draw, (rx, 140), "⚡ SAO CHÉP ĐỘ NHẠY 1 CHẠM", font=font_bold_20, bg=(20, 45, 30), fg=GREEN, border=GREEN)
        
        draw.text((rx, 200), "DÁN VÀO GAME & TRẢI NGHIỆM NGAY", font=font_title_lg, fill=WHITE)
        draw.text((rx, 275), "Chỉ cần 1 chạm là bạn đã lưu và áp dụng xong bảng độ nhạy", font=font_bold_24, fill=CYAN)
        
        # Grand CTA Box
        draw_card(draw, [rx, 340, rx + 1060, 680], fill=CARD_BG, outline=GOLD, radius=22, width=3)
        
        draw.text((rx + 150, 380), "🏆 LÀM CHỦ MỌI TRẬN ĐẤU FREE FIRE!", font=font_title_lg, fill=GOLD)
        draw.text((rx + 260, 450), "BẮN LÀ GỤC • KÉO LÀ ĐỎ RỰC", font=font_title_md, fill=WHITE)
        
        draw.text((rx + 330, 520), "⭐ ⭐ ⭐ ⭐ ⭐", font=font_title_md, fill=GOLD)
        draw.text((rx + 380, 575), "5.0 ĐÁNH GIÁ XUẤT SẮC", font=font_bold_20, fill=GREEN)
        
        btn_box = [rx + 140, 610, rx + 920, 670]
        draw.rounded_rectangle(btn_box, radius=16, fill=ORANGE, outline=GOLD, width=2)
        draw.text((rx + 220, 625), "🚀 TRẢI NGHIỆM MIỄN PHÍ NGAY HÔM NAY!", font=font_title_sm, fill=WHITE)
        
        draw.text((rx + 240, 740), "ĐẲNG CẤP - ĐỘ NHẠY FREE FIRE PRO 2026", font=font_bold_24, fill=TEXT_MUTED)
        draw.text((rx + 290, 775), "Tối ưu hóa độ nhạy kéo tâm chuẩn Esports cho mọi game thủ", font=font_regular_18, fill=CYAN)
        
        pipe.stdin.write(im.tobytes())

# ==================== RENDER PIPELINE ====================
def render_all_clips_v2():
    scenes = [
        ("scene1.mp4", render_scene_1, 300, "video_assets/audio_v2/scene1_vo.mp3"),
        ("scene2.mp4", render_scene_2, 390, "video_assets/audio_v2/scene2_vo.mp3"),
        ("scene3.mp4", render_scene_3, 390, "video_assets/audio_v2/scene3_vo.mp3"),
        ("scene4.mp4", render_scene_4, 390, "video_assets/audio_v2/scene4_vo.mp3"),
        ("scene5.mp4", render_scene_5, 330, "video_assets/audio_v2/scene5_vo.mp3")
    ]
    
    clip_paths = []
    for fname, render_func, nframes, audio_file in scenes:
        out_clip = os.path.join("video_assets/clips_v2", fname)
        tmp_video = out_clip + ".tmp.mp4"
        
        cmd = [
            'ffmpeg', '-y',
            '-f', 'rawvideo',
            '-vcodec', 'rawvideo',
            '-s', f'{WIDTH}x{HEIGHT}',
            '-pix_fmt', 'rgb24',
            '-r', str(FPS),
            '-i', '-',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'ultrafast',
            tmp_video
        ]
        
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
        render_func(proc, nframes)
        proc.stdin.close()
        proc.wait()
        
        # Combine with female voiceover
        cmd_mux = [
            'ffmpeg', '-y',
            '-i', tmp_video,
            '-i', audio_file,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            out_clip
        ]
        subprocess.run(cmd_mux, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(tmp_video):
            os.remove(tmp_video)
        print(f"Generated Clip v2: {out_clip}")
        clip_paths.append(out_clip)
        
    return clip_paths

def concatenate_and_master_v2():
    print("Concatenating 5 scenes into final video v2...")
    
    list_file = "video_assets/clips_v2/concat_list.txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for i in range(1, 6):
            f.write(f"file 'scene{i}.mp4'\n")
            
    raw_joined = "video_assets/clips_v2/joined_raw.mp4"
    subprocess.run([
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', list_file,
        '-c', 'copy',
        raw_joined
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    final_output = "video_gioi_thieu_do_nhay_ff_1phut.mp4"
    bgm_file = "video_assets/audio/gaming_bgm.wav"
    
    # Mix video with Voiceover and gentle Background Music (BGM at -20dB so the female voice is ultra clear)
    cmd_master = [
        'ffmpeg', '-y',
        '-i', raw_joined,
        '-i', bgm_file,
        '-filter_complex',
        '[1:a]volume=0.12[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]',
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '19',
        '-c:a', 'aac',
        '-b:a', '192k',
        final_output
    ]
    
    subprocess.run(cmd_master, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Master Video v2 Successfully Generated: {final_output}")
    return final_output

def create_srt_subtitles_v2():
    srt_content = """1
00:00:00,000 --> 00:00:05,000
Xin chào các bạn! Nếu bạn đang bắn Free Fire mà kéo tâm hay bị trượt hoặc khựng đạn,

2
00:00:05,000 --> 00:00:10,000
thì đây là ứng dụng tra cứu độ nhạy chuẩn thi đấu dành cho bạn.

3
00:00:10,000 --> 00:00:16,500
Ứng dụng hỗ trợ hơn một trăm dòng máy từ iPhone, Samsung, Xiaomi đến ROG Phone.

4
00:00:16,500 --> 00:00:23,000
Chỉ cần chọn đúng dòng máy bạn đang dùng là có ngay bảng độ nhạy tối ưu nhất.

5
00:00:23,000 --> 00:00:29,500
Mọi thông số đều được cập nhật theo thang đo hai trăm mới nhất,

6
00:00:29,500 --> 00:00:36,000
từ nhìn xung quanh, red dot đến ống ngắm 2x và 4x, giúp tâm bắn vừa tay và cực kỳ ổn định.

7
00:00:36,000 --> 00:00:42,500
Đặc biệt, ứng dụng gợi ý luôn kích thước nút bắn chuẩn theo phần trăm,

8
00:00:42,500 --> 00:00:49,000
cùng hướng dẫn kéo thẳng khi bắn tầm xa hoặc vuốt chữ J khi bắn cận chiến để dễ dàng One-shot.

9
00:00:49,000 --> 00:00:54,500
Chỉ với một chạm là bạn đã sao chép xong độ nhạy để cài vào game.

10
00:00:54,500 --> 00:01:00,000
Hãy trải nghiệm ngay hôm nay để kéo tâm mượt hơn và tự tin gánh team nhé!
"""
    with open("subtitles_1phut.srt", "w", encoding="utf-8") as f:
        f.write(srt_content)
    print("Generated subtitles_1phut.srt (v2)")

if __name__ == "__main__":
    t0 = time.time()
    create_srt_subtitles_v2()
    render_all_clips_v2()
    concatenate_and_master_v2()
    print(f"All done in {time.time() - t0:.1f}s!")
