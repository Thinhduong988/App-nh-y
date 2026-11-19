# -*- coding: utf-8 -*-
import os
import math
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30

# Elegant Dark Cyber Theme
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

os.makedirs("video_assets/clips_30s", exist_ok=True)

def create_base_canvas():
    im = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(im)
    for r in range(350, 0, -50):
        alpha = int(14 * (1.0 - r / 350.0))
        draw.ellipse([WIDTH // 2 - r * 2, -r, WIDTH // 2 + r * 2, r * 2], fill=(alpha, alpha // 2, alpha * 2))

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
    
    pdraw.rounded_rectangle([0, 0, pw, ph], radius=38, fill=(17, 10, 36, 255), outline=(112, 51, 255, 255), width=3)
    pdraw.rounded_rectangle([3, 3, pw-3, ph-3], radius=35, outline=(255, 98, 0, 160), width=2)
    
    mask = Image.new('L', (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=26, fill=255)
    phone.paste(src_resized, (pad, pad), mask)
    
    notch_w, notch_h = 110, 22
    nx = (pw - notch_w) // 2
    pdraw.rounded_rectangle([nx, pad + 2, nx + notch_w, pad + 2 + notch_h], radius=11, fill=(10, 5, 20, 255), outline=(58, 35, 110, 255), width=1)
    pdraw.ellipse([nx + notch_w - 24, pad + 6, nx + notch_w - 10, pad + 20], fill=(2, 2, 8, 255), outline=(40, 20, 70, 255))
    
    return phone

PHONE_HOME = make_phone_frame("video_assets/screenshots/shot_home.png", 860)
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

# ==================== SCENE 1: HOOK & GIỚI THIỆU (6.5s = 195 frames) ====================
def render_scene_1(pipe, num_frames=195):
    print(f"Rendering Scene 1 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_HOME, (140, 110), PHONE_HOME)
        
        rx = 700
        draw_badge(draw, (rx, 150), "🔥 ỨNG DỤNG ĐỘ NHẠY FREE FIRE 2026", font=font_bold_20, bg=(50, 25, 10), fg=GOLD, border=GOLD)
        
        draw.text((rx, 215), "BẮN MÃI KHÔNG LÊN ĐẦU?", font=font_title_lg, fill=(255, 80, 80))
        draw.text((rx, 285), "TRA CỨU ĐỘ NHẠY CHUẨN THI ĐẤU", font=font_title_lg, fill=WHITE)
        draw.text((rx, 355), "Bí quyết giúp tâm đỏ rực, không còn bị khựng đạn hay trượt đầu", font=font_bold_24, fill=CYAN)
        
        draw_card(draw, [rx, 430, rx + 1060, 680], fill=CARD_BG, outline=ORANGE)
        draw.text((rx + 40, 470), "🎯 TỐI ƯU HÓA KÉO TÂM DỄ DÀNG", font=font_title_sm, fill=ORANGE)
        draw.text((rx + 40, 520), "• Tinh chỉnh chuẩn xác theo từng thiết bị bạn đang dùng\n• Khắc phục hoàn toàn lỗi tâm dính thân hay vọt qua đầu\n• Cập nhật thông số chuẩn OB mới nhất", font=font_regular_22, fill=WHITE)
        
        draw.text((rx + 160, 750), "⭐ HỖ TRỢ ĐẮC LỰC CHO ANH EM LEO RANK & BẮN GIẢI", font=font_bold_24, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 2: 100+ MÁY & THANG 200 (8.0s = 240 frames) ====================
def render_scene_2(pipe, num_frames=240):
    print(f"Rendering Scene 2 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_DETAIL, (140, 110), PHONE_DETAIL)
        
        rx = 700
        draw_badge(draw, (rx, 130), "📱 HƠN 100+ DÒNG MÁY • THANG ĐO 200 MỚI", font=font_bold_20, bg=(20, 30, 60), fg=CYAN, border=CYAN)
        
        draw.text((rx, 185), "BẢNG ĐỘ NHẠY CHUẨN THI ĐẤU", font=font_title_lg, fill=WHITE)
        draw.text((rx, 255), "Hỗ trợ iPhone, Samsung, Xiaomi, POCO, ROG Phone...", font=font_bold_24, fill=GOLD)
        
        # Sensitivity progress bars
        draw_card(draw, [rx, 315, rx + 1060, 690], fill=CARD_BG, outline=CARD_BORDER, radius=20)
        
        anim_p = min(1.0, f / 30.0)
        sliders = [
            ("👁️ Nhìn Xung Quanh", int(184 * anim_p), 184, CYAN),
            ("🔴 Red Dot Sight", int(172 * anim_p), 172, ORANGE),
            ("🔭 Ống Ngắm 2x", int(166 * anim_p), 166, GOLD),
            ("🎯 Ống Ngắm 4x", int(158 * anim_p), 158, GREEN),
        ]
        
        for i, (label, val, max_val, col) in enumerate(sliders):
            sy = 345 + i * 82
            draw.text((rx + 35, sy), label, font=font_bold_24, fill=WHITE)
            draw_progress_bar(draw, [rx + 300, sy + 6, rx + 880, sy + 28], (val / 200.0) * 100.0, color=col)
            draw.text((rx + 910, sy), f"{val}/200", font=font_bold_24, fill=col)
            
        draw.rounded_rectangle([rx, 725, rx + 1060, 785], radius=12, fill=(20, 35, 45))
        draw.text((rx + 40, 740), "✨ Tâm bắn vừa tay, không bị giật, dễ dàng khóa đầu đối phương", font=font_bold_20, fill=CYAN)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 3: NÚT BẮN & KÉO CHỮ J (8.0s = 240 frames) ====================
def render_scene_3(pipe, num_frames=240):
    print(f"Rendering Scene 3 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_DETAIL, (140, 110), PHONE_DETAIL)
        
        rx = 700
        draw_badge(draw, (rx, 130), "🎯 MÔ PHỎNG NÚT BẮN (HUD) & HƯỚNG VUỐT", font=font_bold_20, bg=(50, 20, 10), fg=ORANGE, border=ORANGE)
        
        draw.text((rx, 185), "KÍCH THƯỚC NÚT BẮN: 42%", font=font_title_lg, fill=WHITE)
        draw.text((rx, 255), "Vị trí đặt: Đáy 11% • Cách lề phải 18%", font=font_bold_24, fill=CYAN)
        
        # 2 Gesture cards
        draw_card(draw, [rx, 315, rx + 515, 660], fill=CARD_BG, outline=CYAN, radius=18)
        draw.text((rx + 30, 345), "🔼 KÉO THẲNG (TẦM XA)", font=font_bold_24, fill=CYAN)
        draw.text((rx + 30, 400), "• Sấy M4A1, Scar, MP40\n• Kéo thẳng đều từ ngực lên\n• Ghìm tâm ổn định chống rung", font=font_regular_22, fill=WHITE)
        
        draw_card(draw, [rx + 545, 315, rx + 1060, 660], fill=CARD_BG, outline=GREEN, radius=18)
        draw.text((rx + 575, 345), "⤴️ VUỐT CHỮ J (CẬN CHIẾN)", font=font_bold_24, fill=GREEN)
        draw.text((rx + 575, 400), "• Shotgun M1887, M1014\n• Móc ngược cực nhanh\n• Dễ dàng One-shot gục ngay", font=font_regular_22, fill=WHITE)
        
        draw.rounded_rectangle([rx, 710, rx + 1060, 780], radius=14, fill=(40, 25, 10), outline=GOLD, width=1)
        draw.text((rx + 160, 730), "🏆 KÉO PHÁT NÀO • ĐỎ ĐẦU PHÁT ĐÓ!", font=font_title_md, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

# ==================== SCENE 4: SAO CHÉP & CALL TO ACTION (7.5s = 225 frames) ====================
def render_scene_4(pipe, num_frames=225):
    print(f"Rendering Scene 4 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        im.paste(PHONE_ACCOUNT, (140, 110), PHONE_ACCOUNT)
        
        rx = 700
        draw_badge(draw, (rx, 130), "⚡ SAO CHÉP ĐỘ NHẠY 1 CHẠM", font=font_bold_20, bg=(20, 45, 30), fg=GREEN, border=GREEN)
        
        draw.text((rx, 185), "DÁN VÀO GAME & TRẢI NGHIỆM NGAY", font=font_title_lg, fill=WHITE)
        draw.text((rx, 255), "Chỉ với 1 chạm là bạn đã lưu và áp dụng xong bảng độ nhạy", font=font_bold_24, fill=CYAN)
        
        # Grand CTA Box
        draw_card(draw, [rx, 315, rx + 1060, 670], fill=CARD_BG, outline=GOLD, radius=22, width=3)
        
        draw.text((rx + 160, 355), "🏆 TỰ TIN GÁNH TEAM MỌI TRẬN ĐẤU!", font=font_title_lg, fill=GOLD)
        draw.text((rx + 260, 430), "BẮN LÀ GỤC • KÉO LÀ ĐỎ RỰC", font=font_title_md, fill=WHITE)
        
        draw.text((rx + 330, 500), "⭐ ⭐ ⭐ ⭐ ⭐", font=font_title_md, fill=GOLD)
        draw.text((rx + 380, 555), "5.0 ĐÁNH GIÁ XUẤT SẮC", font=font_bold_20, fill=GREEN)
        
        btn_box = [rx + 140, 590, rx + 920, 650]
        draw.rounded_rectangle(btn_box, radius=16, fill=ORANGE, outline=GOLD, width=2)
        draw.text((rx + 230, 605), "🚀 TRẢI NGHIỆM MIỄN PHÍ NGAY HÔM NAY!", font=font_title_sm, fill=WHITE)
        
        draw.text((rx + 240, 725), "ĐẲNG CẤP - ĐỘ NHẠY FREE FIRE PRO 2026", font=font_bold_24, fill=TEXT_MUTED)
        
        pipe.stdin.write(im.tobytes())

# ==================== RENDER PIPELINE ====================
def render_all_clips_30s():
    scenes = [
        ("scene1.mp4", render_scene_1, 195, "video_assets/audio_30s/scene1_vo.mp3"),
        ("scene2.mp4", render_scene_2, 240, "video_assets/audio_30s/scene2_vo.mp3"),
        ("scene3.mp4", render_scene_3, 240, "video_assets/audio_30s/scene3_vo.mp3"),
        ("scene4.mp4", render_scene_4, 225, "video_assets/audio_30s/scene4_vo.mp3")
    ]
    
    clip_paths = []
    for fname, render_func, nframes, audio_file in scenes:
        out_clip = os.path.join("video_assets/clips_30s", fname)
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
        print(f"Generated Clip 30s: {out_clip}")
        clip_paths.append(out_clip)
        
    return clip_paths

def concatenate_and_master_30s():
    print("Concatenating 4 scenes into final 30s video...")
    
    list_file = "video_assets/clips_30s/concat_list.txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for i in range(1, 5):
            f.write(f"file 'scene{i}.mp4'\n")
            
    raw_joined = "video_assets/clips_30s/joined_raw.mp4"
    subprocess.run([
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', list_file,
        '-c', 'copy',
        raw_joined
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    final_output = "video_gioi_thieu_do_nhay_ff_30s.mp4"
    bgm_file = "video_assets/audio/gaming_bgm.wav"
    
    # Mix video with Voiceover and gentle Background Music
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
    print(f"Master Video 30s Successfully Generated: {final_output}")
    return final_output

def create_srt_subtitles_30s():
    srt_content = """1
00:00:00,000 --> 00:00:03,500
Bắn Free Fire mãi không lên đầu?

2
00:00:03,500 --> 00:00:06,500
Xem ngay ứng dụng tra cứu độ nhạy chuẩn thi đấu 2026!

3
00:00:06,500 --> 00:00:10,500
Hỗ trợ hơn một trăm dòng máy từ iPhone, Samsung đến Xiaomi,

4
00:00:10,500 --> 00:00:14,500
đầy đủ thông số nhìn xung quanh và ống ngắm thang hai trăm mới nhất.

5
00:00:14,500 --> 00:00:18,500
Gợi ý chính xác kích thước nút bắn cùng hướng vuốt tâm chữ J

6
00:00:18,500 --> 00:00:22,500
giúp bạn kéo phát nào, đỏ đầu phát đó.

7
00:00:22,500 --> 00:00:26,000
Sao chép một chạm vào game cực nhanh.

8
00:00:26,000 --> 00:00:30,000
Trải nghiệm ngay hôm nay để tự tin gánh team nhé!
"""
    with open("subtitles_30s.srt", "w", encoding="utf-8") as f:
        f.write(srt_content)
    print("Generated subtitles_30s.srt")

if __name__ == "__main__":
    t0 = time.time()
    create_srt_subtitles_30s()
    render_all_clips_30s()
    concatenate_and_master_30s()
    print(f"All 30s video done in {time.time() - t0:.1f}s!")
