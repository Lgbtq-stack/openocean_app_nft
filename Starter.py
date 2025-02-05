import asyncio
import logging

from aiogram import Bot, Dispatcher, types, F
from aiogram.enums import ContentType
from aiogram.filters import Command
from aiogram.types import WebAppInfo, ReplyKeyboardMarkup, KeyboardButton

from Config import API_TOKEN, MINI_APP_URL

bot = Bot(token=API_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def start(message: types.Message):
    await message.answer(
        "Привет! Нажми на кнопку ниже, чтобы открыть веб-приложение.",
        reply_markup=ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="Open App", web_app=WebAppInfo(url=MINI_APP_URL))]]))

@dp.message(F.content_type == ContentType.WEB_APP_DATA)
async def handle_web_app_data(message: types.Message):
    data = message.web_app_data.data  # Данные из Web App
    print(f"Полученные данные: {data}")
    await message.answer(f"Данные получены: {data}")


@dp.callback_query()
async def callback_handler(query: types.CallbackQuery):
    await query.answer(f"Вы нажали на кнопку {query.data}")

@dp.message()
async def debug_handler(message: types.Message):
    print(f"Получено сообщение: {message}")
    await message.answer("Сообщение получено, но не обработано.")

async def main():
    await dp.start_polling(bot, skip_updates=True)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот выключен!")
