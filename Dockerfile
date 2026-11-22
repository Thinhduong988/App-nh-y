# Dockerfile cho ban Web App Do Nhay Free Fire AI Pro
FROM nginx:alpine

# Loai bo trang mac dinh cua Nginx
RUN rm -rf /usr/share/nginx/html/*

# Sao chep giao dien web va du lieu do nhay OTA vao container
COPY index.html /usr/share/nginx/html/index.html
COPY src/data /usr/share/nginx/html/data

# Cau hinh mo cong 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
