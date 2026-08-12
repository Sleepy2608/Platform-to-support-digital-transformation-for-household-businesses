package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.User;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class BusinessContextService {

    private final UserRepository userRepository;

    public BusinessContextService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long requireBusinessId(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (user.getBusinessId() == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }
        return user.getBusinessId();
    }
}
