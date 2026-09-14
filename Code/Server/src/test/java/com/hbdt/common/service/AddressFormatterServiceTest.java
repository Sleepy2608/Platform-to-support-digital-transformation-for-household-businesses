package com.hbdt.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.entity.District;
import com.hbdt.entity.Province;
import com.hbdt.entity.Ward;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressFormatterServiceTest {

    @Mock
    private GeoReferenceStore geoReferenceStore;

    private AddressFormatterService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new AddressFormatterService(geoReferenceStore, objectMapper);
    }

    @Test
    void formatAddress_ValidJson_ReturnsFormattedAddress() {
        String json = """
                {
                    "detailAddress": "Số 123 Phố Huế",
                    "wardCode": "00001",
                    "districtCode": "001",
                    "provinceCode": "01"
                }
                """;

        when(geoReferenceStore.findWard("00001")).thenReturn(
                Ward.builder().code("00001").name("Phúc Xá").nameWithType("Phường Phúc Xá").build()
        );
        when(geoReferenceStore.findDistrict("001")).thenReturn(
                District.builder().code("001").name("Ba Đình").nameWithType("Quận Ba Đình").build()
        );
        when(geoReferenceStore.findProvince("01")).thenReturn(
                Province.builder().code("01").name("Hà Nội").nameWithType("Thành phố Hà Nội").build()
        );

        String result = service.formatAddress(json);

        assertThat(result).isEqualTo("Số 123 Phố Huế, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội");
    }

    @Test
    void formatAddress_JsonMissingFields_SkipsMissingFields() {
        // Trường hợp 1: Thiếu detailAddress
        String jsonNoDetail = """
                {
                    "wardCode": "00001",
                    "districtCode": "001",
                    "provinceCode": "01"
                }
                """;
        when(geoReferenceStore.findWard("00001")).thenReturn(
                Ward.builder().nameWithType("Phường Phúc Xá").build()
        );
        when(geoReferenceStore.findDistrict("001")).thenReturn(
                District.builder().nameWithType("Quận Ba Đình").build()
        );
        when(geoReferenceStore.findProvince("01")).thenReturn(
                Province.builder().nameWithType("Thành phố Hà Nội").build()
        );

        String result1 = service.formatAddress(jsonNoDetail);
        assertThat(result1).isEqualTo("Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội");

        // Trường hợp 2: Chỉ có detailAddress và provinceCode (thiếu wardCode và districtCode)
        String jsonOnlyDetailAndProvince = """
                {
                    "detailAddress": "Khu công nghiệp VSIP",
                    "provinceCode": "01"
                }
                """;
        String result2 = service.formatAddress(jsonOnlyDetailAndProvince);
        assertThat(result2).isEqualTo("Khu công nghiệp VSIP, Thành phố Hà Nội");

        // Trường hợp 3: JSON rỗng {}
        String emptyJson = "{}";
        String result3 = service.formatAddress(emptyJson);
        assertThat(result3).isEmpty();
    }

    @Test
    void formatAddress_NonExistentGeoCodes_SkipsUnfoundCodes() {
        String json = """
                {
                    "detailAddress": "Cửa hàng số 5",
                    "wardCode": "99999",
                    "districtCode": "001",
                    "provinceCode": "88888"
                }
                """;

        // Ward 99999 và Province 88888 không tồn tại trong GeoReferenceStore
        when(geoReferenceStore.findWard("99999")).thenReturn(null);
        when(geoReferenceStore.findProvince("88888")).thenReturn(null);
        when(geoReferenceStore.findDistrict("001")).thenReturn(
                District.builder().nameWithType("Quận Ba Đình").build()
        );

        String result = service.formatAddress(json);

        // Bỏ qua ward và province không tìm thấy, chỉ lấy detailAddress và districtName
        assertThat(result).isEqualTo("Cửa hàng số 5, Quận Ba Đình");
    }

    @Test
    void formatAddress_RawStringOldAddress_ReturnsOriginalString() {
        String rawAddress1 = "123 Phố Huế, Hai Bà Trưng, Hà Nội";
        String result1 = service.formatAddress(rawAddress1);
        assertThat(result1).isEqualTo("123 Phố Huế, Hai Bà Trưng, Hà Nội");

        String rawAddress2 = "Thôn 2, Xã An Bình, Huyện Lạc Thủy, Tỉnh Hòa Bình";
        String result2 = service.formatAddress(rawAddress2);
        assertThat(result2).isEqualTo("Thôn 2, Xã An Bình, Huyện Lạc Thủy, Tỉnh Hòa Bình");
    }

    @Test
    void formatAddress_NullOrBlank_ReturnsEmptyString() {
        assertThat(service.formatAddress(null)).isEmpty();
        assertThat(service.formatAddress("")).isEmpty();
        assertThat(service.formatAddress("   ")).isEmpty();
    }

    @Test
    void formatAddress_MalformedJson_ReturnsOriginalString() {
        String malformedJson = "{\"detailAddress\": \"123 Phố Huế\", invalid}";
        assertThat(service.formatAddress(malformedJson)).isEqualTo(malformedJson);
    }
}
