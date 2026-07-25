# Shared

Backend dung Java, frontend dung JavaScript nen khong the dung chung code
truc tiep. Thu muc nay chua cac **hop dong (contract)** ma ca hai phia phai
tuan theo, de tranh lech du lieu giua cac team:

- `api-contract.md` — quy uoc chung ve response envelope, ma loi, phan trang.
- `enums.md` — danh sach cac enum dung chung (vai tro, trang thai subscription,
  trang thai don hang...) phai duoc dong bo giua
  `backend/.../entity/UserRole.java` va `frontend/src/shared/constants/roles.js`.

Khi thay doi mot enum hoac cau truc response, cap nhat file tuong ung trong
thu muc nay truoc, roi moi sua code o backend/frontend.
