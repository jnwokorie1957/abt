bind = '0.0.0.0:8080'
workers = 2
threads = 4
timeout = 30
accesslog = '-'
errorlog = '-'
# The edge proxy supplies client headers; do not trust public spoofed headers.
forwarded_allow_ips = ''
