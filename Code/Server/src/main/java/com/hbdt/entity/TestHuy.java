package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "test_huy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestHuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten", length = 100)
    private String ten;

    @Column(name = "ghi_chu", length = 255)
    private String ghiChu;
}
