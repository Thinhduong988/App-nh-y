# -*- coding: utf-8 -*-
import os
import sys
import math
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1920
HEIGHT = 1080
FPS = 30

# Colors
BG_DARK = (7, 5, 18)
BG_PURPLE = (17, 10, 36)
CYAN = (0, 240, 255)
ORANGE = (255, 98, 0)
GOLD = (255, 184, 0)
WHITE = (255, 255, 255)
TEXT_MUTED = (157, 150, 184)
GREEN = (0, 255, 136)
RED = (255, 59, 48)
CARD_BG = (24, 15, 51)
CARD_BORDER = (58, 35, 110)

# Fonts
FONT_DIR = "C:/Windows/Fonts"
font_title_lg = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 54)
font_title_md = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 40)
font_title_sm = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 30)
font_bold_24 = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 24)
font_bold_20 = ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", 20)
font_regular_22 = ImageFont.truetype(f"{FONT_DIR}/segoeui.ttf", 22)
font_regular_18 = ImageFont.truetype(f"{FONT_DIR}/segoeui.ttf", 18)

os.makedirs("video_assets/clips", exist_ok=True)

def create_base_canvas():
    """Create a high-tech cosmic cyber background with grid"""
    im = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(im)
    
    # Top cosmic glow
    for r in range(400, 0, -40):
        alpha = int(18 * (1.0 - r / 400.0))
        glow_box = [WIDTH // 2 - r * 2, -r, WIDTH // 2 + r * 2, r * 2]
        draw.ellipse(glow_box, fill=(alpha, alpha // 2, alpha * 2))

    # Grid lines
    for x in range(0, WIDTH, 120):
        draw.line([(x, 0), (x, HEIGHT)], fill=(20, 14, 42), width=1)
    for y in range(0, HEIGHT, 100):
        draw.line([(0, y), (WIDTH, y)], fill=(20, 14, 42), width=1)
        
    return im

BASE_CANVAS = create_base_canvas()

def make_phone_frame(screen_path, target_h=860):
    """Wrap app screenshot in sleek cyber smartphone bezel"""
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
    
    # Top notch
    notch_w, notch_h = 110, 22
    nx = (pw - notch_w) // 2
    pdraw.rounded_rectangle([nx, pad + 2, nx + notch_w, pad + 2 + notch_h], radius=11, fill=(10, 5, 20, 255), outline=(58, 35, 110, 255), width=1)
    pdraw.ellipse([nx + notch_w - 24, pad + 6, nx + notch_w - 10, pad + 20], fill=(2, 2, 8, 255), outline=(40, 20, 70, 255))
    
    return phone

PHONE_HOME = make_phone_frame("video_assets/screenshots/shot_home.png", 860)
PHONE_SENS = make_phone_frame("video_assets/screenshots/shot_sens.png", 860)
PHONE_DETAIL = make_phone_frame("video_assets/screenshots/shot_detail.png", 860)
PHONE_GEN = make_phone_frame("video_assets/screenshots/shot_gen.png", 860)
PHONE_ACCOUNT = make_phone_frame("video_assets/screenshots/shot_account.png", 860)

def draw_card(draw, box, fill=CARD_BG, outline=CARD_BORDER, radius=16, width=2):
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

def draw_crosshair(draw, center, radius, color=RED, angle=0):
    cx, cy = center
    # Rotating outer ring with dash gaps
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=3)
    draw.ellipse([cx - radius // 2, cy - radius // 2, cx + radius // 2, cy + radius // 2], outline=color, width=2)
    # 4 pointer lines
    line_len = radius + 20
    draw.line([(cx - line_len, cy), (cx - radius + 10, cy)], fill=color, width=3)
    draw.line([(cx + radius - 10, cy), (cx + line_len, cy)], fill=color, width=3)
    draw.line([(cx, cy - line_len), (cx, cy - radius + 10)], fill=color, width=3)
    draw.line([(cx, cy + radius - 10), (cx, cy + line_len)], fill=color, width=3)
    # Center dot
    draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=color)

def render_scene_1(pipe, num_frames=345):
    """Scene 1: Hook, Problem & App Reveal (11.5s = 345 frames)"""
    print(f"Rendering Scene 1 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        t = f / FPS
        
        if f < 135: # Part A: Pain Point / The Hook (0s - 4.5s)
            # Center Animated Target Crosshair
            cross_radius = int(90 + 15 * math.sin(f * 0.15))
            draw_crosshair(draw, (WIDTH // 2, HEIGHT // 2 - 40), cross_radius, color=RED)
            
            # Top Warning Badge
            draw_badge(draw, (WIDTH // 2 - 270, 160), "⚠️ CẢNH BÁO: BẠN ĐANG GẶP LỖI KÉO TÂM?", font=font_bold_20, bg=(60, 15, 20), fg=RED, border=RED)
            
            # Big Pulsing Text
            shake = int(3 * math.sin(f * 0.5)) if f % 6 < 3 else 0
            draw.text((WIDTH // 2 - 380 + shake, 230), "BẮN FREE FIRE MÃI KHÔNG LÊN ĐẦU?", font=font_title_lg, fill=(255, 80, 80))
            draw.text((WIDTH // 2 - 420, 310), "TÂM BỊ KHỰNG • BẮN VỌT LÊN TRỜI • ĐẠN TOÀN VÀO NGỰC?", font=font_title_sm, fill=WHITE)
            
            # Left & Right Problem Cards
            draw_card(draw, [200, 480, 720, 680], fill=(30, 12, 24), outline=(120, 20, 40))
            draw.text((230, 510), "❌ KÉO QUÁ NHẸ", font=font_title_sm, fill=RED)
            draw.text((230, 560), "• Tâm bị dính chặt vào thân địch\n• Đạn ăn sát ngực, không thể Headshot\n• Bị đối phương phản công hạ gục", font=font_regular_22, fill=TEXT_MUTED)
            
            draw_card(draw, [1200, 480, 1720, 680], fill=(30, 12, 24), outline=(120, 20, 40))
            draw.text((1230, 510), "❌ KÉO QUÁ TAY", font=font_title_sm, fill=RED)
            draw.text((1230, 560), "• Tâm vọt bay qua khỏi đầu địch\n• Đạn trượt lên trời, mất kiểm soát\n• Không hiểu thông số nút bắn & DPI", font=font_regular_22, fill=TEXT_MUTED)
            
            # Bottom hook text
            draw.text((WIDTH // 2 - 260, 780), "ĐÃ CÓ GIẢI PHÁP CHUẨN ESPORTS 2026!", font=font_title_md, fill=GOLD)
            
        else: # Part B: Solution & App Reveal (4.5s - 11.5s)
            # Phone slides in smoothly
            slide_progress = min(1.0, (f - 135) / 25.0)
            phone_x = int(-400 + (120 - (-400)) * (1.0 - math.pow(1.0 - slide_progress, 3)))
            im.paste(PHONE_HOME, (phone_x, 110), PHONE_HOME)
            
            # Right side: App branding and value props
            rx = 680
            draw_badge(draw, (rx, 150), "🔥 GIẢI PHÁP SỐ 1 CHO GAME THỦ VIỆT NAM", font=font_bold_20, bg=(50, 25, 10), fg=GOLD, border=GOLD)
            
            draw.text((rx, 210), "ĐỘ NHẠY FREE FIRE PRO 2026", font=font_title_lg, fill=GOLD)
            draw.text((rx, 280), "ỨNG DỤNG TỐI ƯU KÉO TÂM CHUẨN THI ĐẤU ESPORTS", font=font_bold_24, fill=CYAN)
            
            # 3 Main Feature Cards popping in
            features = [
                ("🎯 Bí Quyết Kéo Tâm Đỏ Rực", "Độ nhạy chuẩn thi đấu, hỗ trợ mọi dòng súng One-shot Shotgun & Sấy MP40", ORANGE),
                ("📱 Tương Thích Hơn 100+ Dòng Máy", "Cập nhật iPhone, Samsung, Xiaomi, ROG Phone... theo chuẩn thang đo 200 mới", CYAN),
                ("⚡ HUD Simulator & AI Độc Quyền", "Mô phỏng kích thước nút bắn, hướng vuốt tâm chữ J & AI tạo độ nhạy riêng", GREEN)
            ]
            
            for idx, (ftitle, fdesc, fcolor) in enumerate(features):
                cy = 370 + idx * 135
                draw_card(draw, [rx, cy, rx + 1100, cy + 115], fill=CARD_BG, outline=fcolor, radius=18)
                # left color bar
                draw.rounded_rectangle([rx, cy, rx + 10, cy + 115], radius=6, fill=fcolor)
                draw.text((rx + 35, cy + 18), ftitle, font=font_title_sm, fill=fcolor)
                draw.text((rx + 35, cy + 62), fdesc, font=font_regular_22, fill=WHITE)
                
            # Floating bottom badge
            draw.text((rx + 250, 830), "⭐ ĐÃ ĐƯỢC HƠN 50,000+ GAME THỦ KIỂM CHỨNG!", font=font_bold_24, fill=GOLD)

        pipe.stdin.write(im.tobytes())

def render_scene_2(pipe, num_frames=405):
    """Scene 2: 100+ Devices & 200 Sensitivity Scale (13.5s = 405 frames)"""
    print(f"Rendering Scene 2 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        # Phone mockup on left (switches from Sens list to Detail)
        phone = PHONE_SENS if f < 180 else PHONE_DETAIL
        im.paste(phone, (120, 110), phone)
        
        # Right side content
        rx = 680
        draw_badge(draw, (rx, 130), "📱 KHO DỮ LIỆU ĐỘ NHẠY ĐA THIẾT BỊ 2026", font=font_bold_20, bg=(20, 30, 60), fg=CYAN, border=CYAN)
        
        draw.text((rx, 180), "HỖ TRỢ HƠN 100+ DÒNG MÁY", font=font_title_lg, fill=WHITE)
        draw.text((rx, 250), "Tối ưu hóa từng dòng màn hình, tần số quét & cảm ứng", font=font_bold_24, fill=TEXT_MUTED)
        
        # Brand chips row
        brands = [("🍏 Apple iPhone", GOLD), ("📱 Samsung Galaxy", CYAN), ("⚡ Xiaomi & POCO", ORANGE), ("🎮 ASUS ROG Phone", RED)]
        bx = rx
        for bname, bcolor in brands:
            b_box = draw_badge(draw, (bx, 305), bname, font=font_bold_20, bg=(25, 18, 48), fg=bcolor, border=bcolor)
            bx = b_box[2] + 16
            
        # Sensitivity 200 Scale Display Box
        draw_card(draw, [rx, 380, rx + 1100, 830], fill=CARD_BG, outline=CARD_BORDER, radius=20)
        draw.text((rx + 35, 410), "📊 THÔNG SỐ ĐỘ NHẠY THANG ĐO 200 CHUẨN THI ĐẤU:", font=font_title_sm, fill=GOLD)
        
        # Animated progress bars
        anim_p = min(1.0, f / 45.0)
        sliders = [
            ("Nhìn Xung Quanh", int(184 * anim_p), 184, CYAN),
            ("Red Dot Sight", int(172 * anim_p), 172, ORANGE),
            ("Ống Ngắm 2x", int(166 * anim_p), 166, GOLD),
            ("Ống Ngắm 4x", int(158 * anim_p), 158, GREEN),
        ]
        
        for i, (label, val, max_val, col) in enumerate(sliders):
            sy = 480 + i * 75
            draw.text((rx + 35, sy), label, font=font_bold_20, fill=WHITE)
            draw_progress_bar(draw, [rx + 260, sy + 6, rx + 940, sy + 26], (val / 200.0) * 100.0, color=col)
            draw.text((rx + 970, sy), f"{val}/200", font=font_bold_24, fill=col)
            
        draw.rounded_rectangle([rx + 35, 765, rx + 1065, 810], radius=10, fill=(30, 20, 50))
        draw.text((rx + 50, 775), "⚡ Tự động tính toán theo kích thước màn hình & DPI an toàn chống khóa máy", font=font_regular_18, fill=CYAN)
        
        pipe.stdin.write(im.tobytes())

def render_scene_3(pipe, num_frames=375):
    """Scene 3: HUD Simulator, Fire Button & J-drag (12.5s = 375 frames)"""
    print(f"Rendering Scene 3 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        # Phone detail on left
        im.paste(PHONE_DETAIL, (120, 110), PHONE_DETAIL)
        
        rx = 680
        draw_badge(draw, (rx, 130), "🎯 TÍNH NĂNG ĐỘC QUYỀN TRÊN APP", font=font_bold_20, bg=(50, 20, 10), fg=ORANGE, border=ORANGE)
        
        draw.text((rx, 180), "MÔ PHỎNG NÚT BẮN (HUD) & HƯỚNG VUỐT", font=font_title_lg, fill=WHITE)
        draw.text((rx, 250), "Bí quyết quyết định 80% tỷ lệ Headshot thành công trong Free Fire!", font=font_bold_24, fill=GOLD)
        
        # Fire button size card with animation
        draw_card(draw, [rx, 310, rx + 1100, 520], fill=CARD_BG, outline=ORANGE, radius=20)
        draw.text((rx + 35, 335), "🔥 KÍCH THƯỚC NÚT BẮN CHUẨN XÁC:", font=font_title_sm, fill=ORANGE)
        
        # Animated button graphic
        btn_radius = int(50 + 6 * math.sin(f * 0.2))
        bx, by = rx + 140, 435
        draw.ellipse([bx - btn_radius - 8, by - btn_radius - 8, bx + btn_radius + 8, by + btn_radius + 8], outline=(255, 98, 0, 100), width=3)
        draw.ellipse([bx - btn_radius, by - btn_radius, bx + btn_radius, by + btn_radius], fill=(255, 98, 0, 180), outline=GOLD, width=3)
        draw.text((bx - 26, by - 16), "42%", font=font_title_sm, fill=WHITE)
        
        draw.text((rx + 240, 385), "• Tỷ lệ kích thước tối ưu: 40% - 46% (Chống chạm nhầm)", font=font_bold_24, fill=WHITE)
        draw.text((rx + 240, 430), "• Vị trí đặt chuẩn: Đáy 11% • Cách lề phải 18%", font=font_regular_22, fill=CYAN)
        draw.text((rx + 240, 465), "• Tạo không gian vuốt tâm tối đa trên màn hình cảm ứng", font=font_regular_22, fill=TEXT_MUTED)
        
        # Drag gesture instructions
        draw_card(draw, [rx, 550, rx + 535, 790], fill=CARD_BG, outline=CYAN, radius=20)
        draw.text((rx + 30, 575), "🔼 KÉO THẲNG (TẦM XA)", font=font_bold_24, fill=CYAN)
        draw.text((rx + 30, 620), "• Áp dụng khi sấy M4A1, Scar, MP40 tầm xa\n• Kéo đều tay thẳng từ ngực lên đầu\n• Giữ nhịp ghìm tâm chống rung đạn", font=font_regular_18, fill=WHITE)
        
        draw_card(draw, [rx + 565, 550, rx + 1100, 790], fill=CARD_BG, outline=GREEN, radius=20)
        draw.text((rx + 595, 575), "⤴️ VUỐT CHỮ J (CẬN CHIẾN)", font=font_bold_24, fill=GREEN)
        draw.text((rx + 595, 620), "• Tuyệt chiêu One-Shot Shotgun (M1887, M1014)\n• Vuốt nhẹ xuống rồi móc ngược cực nhanh\n• Tâm tự động khóa chặt vào đầu địch", font=font_regular_18, fill=WHITE)
        
        draw.text((rx + 280, 830), "🏆 ĐẠT 100% HEADSHOT - BẮN PHÁT NÀO ĐỎ PHÁT ĐÓ!", font=font_title_sm, fill=GOLD)
        
        pipe.stdin.write(im.tobytes())

def render_scene_4(pipe, num_frames=360):
    """Scene 4: AI Sensitivity Generator 5D (12.0s = 360 frames)"""
    print(f"Rendering Scene 4 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        # Phone on left with vertical cyan scanline effect
        phone_copy = PHONE_GEN.copy()
        pdraw = ImageDraw.Draw(phone_copy)
        scan_y = int((f * 8) % 860)
        pdraw.line([(0, scan_y), (476, scan_y)], fill=(0, 240, 255, 220), width=4)
        pdraw.line([(0, max(0, scan_y - 2)), (476, max(0, scan_y - 2))], fill=(0, 240, 255, 120), width=2)
        im.paste(phone_copy, (120, 110), phone_copy)
        
        rx = 680
        draw_badge(draw, (rx, 130), "⚡ CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO 2026", font=font_bold_20, bg=(10, 40, 40), fg=CYAN, border=CYAN)
        
        draw.text((rx, 180), "AI SENSITIVITY GENERATOR 5D", font=font_title_lg, fill=CYAN)
        draw.text((rx, 250), "Tự động phân tích & tính toán bộ độ nhạy riêng biệt theo từng người chơi", font=font_bold_24, fill=WHITE)
        
        # 3 Step AI chips
        ai_steps = [
            ("1. Phân Tích Cấu Hình Phần Cứng", "Đo độ mượt chip CPU, GPU (Snapdragon, Dimensity, Apple A-Series), độ trễ cảm ứng màn hình.", CYAN),
            ("2. Đo Đạc Tần Số Quét Màn Hình", "Tối ưu hóa chính xác cho màn hình 60Hz cơ bản, 90Hz mượt mà hoặc 120Hz-144Hz Gaming cao cấp.", GOLD),
            ("3. Cá Nhân Hóa Theo Lối Chơi", "Chế độ One-Shot Shotgun, Sấy SMG càn quét, hay Bắn Tỉa Sniper tầm xa.", GREEN)
        ]
        
        for idx, (stitle, sdesc, scolor) in enumerate(ai_steps):
            sy = 310 + idx * 125
            draw_card(draw, [rx, sy, rx + 1100, sy + 105], fill=CARD_BG, outline=scolor, radius=16)
            draw.rounded_rectangle([rx, sy, rx + 8, sy + 105], radius=4, fill=scolor)
            draw.text((rx + 30, sy + 15), stitle, font=font_title_sm, fill=scolor)
            draw.text((rx + 30, sy + 55), sdesc, font=font_regular_18, fill=WHITE)
            
        # Bottom AI computation box
        draw_card(draw, [rx, 700, rx + 1100, 830], fill=(20, 10, 40), outline=GOLD, radius=18)
        calc_dots = "." * ((f // 10) % 4)
        draw.text((rx + 35, 725), f"🤖 THUẬT TOÁN ĐANG XỬ LÝ DỮ LIỆU CẢM ỨNG{calc_dots}", font=font_bold_24, fill=GOLD)
        draw.text((rx + 35, 770), "✨ KẾT QUẢ: 100% HOÀN HẢO • ĐỘ NHẠY ĐỘC QUYỀN CHUẨN XÁC DÀNH CHO BẠN!", font=font_bold_20, fill=GREEN)
        
        pipe.stdin.write(im.tobytes())

def render_scene_5(pipe, num_frames=315):
    """Scene 5: Preset Management & Call to Action (10.5s = 315 frames)"""
    print(f"Rendering Scene 5 ({num_frames} frames)...")
    for f in range(num_frames):
        im = BASE_CANVAS.copy()
        draw = ImageDraw.Draw(im)
        
        # Phone on left showing account / presets
        im.paste(PHONE_ACCOUNT, (120, 110), PHONE_ACCOUNT)
        
        rx = 680
        draw_badge(draw, (rx, 130), "🔥 TẬN HƯỞNG TRẢI NGHIỆM ĐỈNH CAO NGAY HÔM NAY", font=font_bold_20, bg=(40, 25, 10), fg=GOLD, border=GOLD)
        
        draw.text((rx, 180), "LƯU CẤU HÌNH & SAO CHÉP 1 CHẠM", font=font_title_lg, fill=WHITE)
        draw.text((rx, 250), "Lưu trữ không giới hạn preset • Chia sẻ nhanh cho đồng đội chiến team", font=font_bold_24, fill=CYAN)
        
        # Grand Call to action card
        draw_card(draw, [rx, 310, rx + 1100, 680], fill=CARD_BG, outline=GOLD, radius=24, width=3)
        
        draw.text((rx + 180, 350), "🏆 LÀM CHỦ MỌI TRẬN ĐẤU FREE FIRE!", font=font_title_lg, fill=GOLD)
        draw.text((rx + 240, 430), "BẮN LÀ GỤC • KÉO LÀ ĐỎ RỰC!", font=font_title_md, fill=WHITE)
        
        # 5 Stars Rating
        draw.text((rx + 320, 500), "⭐ ⭐ ⭐ ⭐ ⭐", font=font_title_md, fill=GOLD)
        draw.text((rx + 410, 560), "5.0 ĐÁNH GIÁ XUẤT SẮC", font=font_bold_20, fill=GREEN)
        
        # Download button
        btn_box = [rx + 150, 600, rx + 950, 665]
        draw.rounded_rectangle(btn_box, radius=18, fill=ORANGE, outline=GOLD, width=2)
        draw.text((rx + 260, 615), "🚀 TẢI VÀ TRẢI NGHIỆM MIỄN PHÍ NGAY!", font=font_title_sm, fill=WHITE)
        
        # Bottom watermark
        draw.text((rx + 220, 740), "ĐẲNG CẤP - ĐỘ NHẠY FREE FIRE PRO 2026", font=font_bold_24, fill=TEXT_MUTED)
        draw.text((rx + 280, 780), "Hỗ trợ 100% Android & iOS • Cập nhật OB mới nhất", font=font_regular_18, fill=CYAN)
        
        pipe.stdin.write(im.tobytes())

def render_all_clips():
    scenes = [
        ("scene1.mp4", render_scene_1, 345, "video_assets/audio/scene1_vo_sync.mp3"),
        ("scene2.mp4", render_scene_2, 405, "video_assets/audio/scene2_vo_sync.mp3"),
        ("scene3.mp4", render_scene_3, 375, "video_assets/audio/scene3_vo_sync.mp3"),
        ("scene4.mp4", render_scene_4, 360, "video_assets/audio/scene4_vo_sync.mp3"),
        ("scene5.mp4", render_scene_5, 315, "video_assets/audio/scene5_vo_sync.mp3")
    ]
    
    clip_paths = []
    
    for fname, render_func, nframes, audio_file in scenes:
        out_clip = os.path.join("video_assets/clips", fname)
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
        
        # Combine with voiceover audio
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
        print(f"Generated Clip: {out_clip}")
        clip_paths.append(out_clip)
        
    return clip_paths

def concatenate_and_master():
    print("Concatenating 5 scenes into final video...")
    
    # Create concat list
    list_file = "video_assets/clips/concat_list.txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for i in range(1, 6):
            f.write(f"file 'scene{i}.mp4'\n")
            
    raw_joined = "video_assets/clips/joined_raw.mp4"
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
    
    # Mix video with Voiceover and Background Music (Audio Ducking / BGM at -18dB)
    cmd_master = [
        'ffmpeg', '-y',
        '-i', raw_joined,
        '-i', bgm_file,
        '-filter_complex',
        '[1:a]volume=0.18[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]',
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
    print(f"Master Video Successfully Generated: {final_output}")
    return final_output

def create_srt_subtitles():
    """Generate SRT subtitle file for CapCut or video players"""
    srt_content = """1
00:00:00,000 --> 00:00:04,500
Bắn Free Fire mãi mà tâm vẫn khựng, trượt đầu hay bắn toàn trúng người?

2
00:00:04,500 --> 00:00:11,500
Đừng lo! Đã có Ứng dụng Độ Nhạy Free Fire Pro 2026 – Trợ thủ kéo tâm chuẩn thi đấu Esports!

3
00:00:11,500 --> 00:00:18,500
Khám phá kho dữ liệu khổng lồ tối ưu cho hơn 100 dòng máy: từ iPhone, Samsung, Xiaomi đến ROG Phone.

4
00:00:18,500 --> 00:00:25,000
Mọi thông số từ Nhìn Xung Quanh, Red Dot đến Ống Ngắm 2x, 4x đều chuẩn hóa theo thang 200 mới nhất!

5
00:00:25,000 --> 00:00:31,000
Đặc biệt: Tính năng mô phỏng kích thước nút bắn chuẩn từng phần trăm (40% - 46%)!

6
00:00:31,000 --> 00:00:37,500
Kèm chỉ dẫn hướng kéo tâm: kéo thẳng tầm xa hoặc vuốt chữ J cận chiến. Bắn là đỏ đầu!

7
00:00:37,500 --> 00:00:43,500
Chưa hết! Thuật toán AI Sensitivity 5D tự động phân tích cấu hình máy, tần số quét 60Hz đến 120Hz.

8
00:00:43,500 --> 00:00:49,500
Cá nhân hóa theo lối chơi One-shot hay Sấy SMG để tạo ra bộ độ nhạy riêng biệt cho chính bạn!

9
00:00:49,500 --> 00:00:54,500
Lưu cấu hình không giới hạn, sao chép một chạm gửi đồng đội cực nhanh!

10
00:00:54,500 --> 00:01:00,000
Tải và trải nghiệm ngay hôm nay để làm chủ mọi trận chiến. Bắn là gục, kéo là đỏ!
"""
    with open("subtitles_1phut.srt", "w", encoding="utf-8") as f:
        f.write(srt_content)
    print("Generated subtitles_1phut.srt")

if __name__ == "__main__":
    t0 = time.time()
    create_srt_subtitles()
    render_all_clips()
    concatenate_and_master()
    print(f"All done in {time.time() - t0:.1f}s!")
