#!/bin/bash

# 获取最新的提交哈希值
commit_hash=$(git rev-parse --short HEAD)

# 获取当前分支名称
branch_name=$(git rev-parse --abbrev-ref HEAD)

# 获取最新修改时间
modification_time=$(date)

# 将这些信息写入文件
echo "Branch: $branch_name, Date: $modification_time, Commit: $commit_hash" > src/version_info.txt
